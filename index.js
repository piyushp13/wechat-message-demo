require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
let accessToken = null;
// const wechat = require('wechat'); // Github: https://github.com/node-webot/wechat

const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);

const app = express();
app.use(cors());
app.use(bodyParser.xml());
app.use(bodyParser.json());
// const router = express.Router();

const staticDirectory = `${__dirname}${path.sep}dist`;
console.log(staticDirectory);
app.use(express.static(staticDirectory));

const config = {
  token: process.env.TOKEN,
  appid: process.env.APP_ID,
  appsecret: process.env.APP_SECRET
  // encodingAESKey: ''
};

let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('crypto support is disabled!');
}

app.get('/wechat', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  if (req.query) {
    const signature = req.query.signature || '';
    const timestamp = req.query.timestamp || '';
    const nonce = req.query.nonce || '';
    const echostr = req.query.echostr || '';
    if (compareSignature(signature, timestamp, nonce)) {
      res.send(echostr);
    } else {
      res.send(echostr);
    }
  }
});

function compareSignature(signature, timestamp, nonce) {
  const sortedParams = [config.token, timestamp, nonce].sort();
  const joinedParamString = sortedParams.join("");
  const shasum = crypto.createHash('sha1');
  shasum.update(joinedParamString);
  const generatedSignature = shasum.digest('hex');
  console.log(generatedSignature);
  if (signature == generatedSignature) {
    return true;
  } else {
    return false;
  }
}

async function getAccessToken() {
  console.log(`APP_ID=${config.appid}, APP_SECRET=${config.appsecret}`);
  const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appid}&secret=${config.appsecret}`;
  let token = null;
  let expiryTime = 60;
  try {
    const response = await axios.get(tokenUrl);
    const resData = response.data;
    console.log('Response from Wechat API ', resData, typeof resData);
    if (resData && resData.hasOwnProperty('access_token')) {
      token = resData['access_token'];
      expiryTime = +resData['expires_in'];
    } else {
      throw new Error('Invalid request');
    }
  } catch (error) {
    console.log('Error hitting WeChat API');
    console.log(error);
    reject(error);
  } finally {
    console.log('Access Token is: ', token);
    accessToken = token;
    return { token, expiryTime };
  }
}

const createMessage = (to, from, content) => `
    <xml>
      <ToUserName><![CDATA[${to}]]></ToUserName>
      <FromUserName><![CDATA[${from}]]></FromUserName>
      <CreateTime>${new Date().getTime() / 1000}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${content}]]></Content>
      <FuncFlag>0</FuncFlag>
    </xml>
  `;
const handleUnknown = (res, xml) => {
  const msg = createMessage(
    xml.FromUserName[0],
    xml.ToUserName[0],
    "Sorry, I don't understand what you just sent...",
  )
  console.log(`WeChat - Responding with: ${msg}`)
  return res.send(msg)
};
async function handleText(res, xml) {
  let content = xml.Content[0];
  let reply = content;
  content = content.toLowerCase();
  switch (content) {
    case 'hi':
    case 'hello':
    case 'hey':
      reply = content;
      break;
    case 'how are you?':
    case 'how are you':
    case 'how are you doing':
      reply = "I'm good, what about you?";
      break;
    default:
      reply = "I'm afraid I can't comment on that.";
  }
  const msg = createMessage(
    xml.FromUserName[0],
    xml.ToUserName[0],
    reply,
  );
  let sender = xml.FromUserName[0];
  try {
    const userProfile = await axios.get(userProfileApi(sender));
    const userData = userProfile.data;
    sender = userData.nickname || sender;
  } catch (error) {
    console.error(error);
  } finally {
    io.emit("message", { type: "new-message", text: xml.Content[0], from: sender });
  }
  console.log(`WeChat - Responding with: ${msg}`);
  io.emit("message", { type: "new-message", text: reply, from: xml.ToUserName[0] });
  return res.send(msg);
}
const handleEvent = (res, xml) => {
  const [event] = xml.Event
  if (event === 'subscribe') {
    const msg = createMessage(
      xml.FromUserName[0],
      xml.ToUserName[0],
      'Welcome to our Official Account!',
    )
    io.emit("message", { type: "new-message", text: `${xml.ToUserName[0]} is now a follower` });
    console.log(`WeChat - Responding with: ${msg}`);
    return res.send(msg)
  } else {
    return notFound(res)
  }
};
app.post('/wechat', (req, res) => {
  const { xml } = req.body
  console.log(`WeChat - Got request: ${JSON.stringify(xml)}`)
  switch (xml.MsgType[0]) {
    case 'event':
      return handleEvent(res, xml)
    case 'text':
      return handleText(res, xml)
    default:
      return handleUnknown(res, xml)
  }
  return notFound(res)
});

const userProfileApi = (openid) => `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${openid}&lang=en_US`;

async function getFollowers(req, res) {
  let result = [];
  if (!accessToken) {
    getAccessToken()
      .then(({ token, expiryTime }) => {
        getFollowersDetail(res);
      })
      .catch(error => {
        console.log('Error retrieving token');
        res.end(JSON.stringify(result));
      });
  } else {
    getFollowersDetail(res);
  }
};

async function getFollowersDetail(res) {
    const followersUrl = `https://api.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}&next_openid=`;
    try {
      const followersRes = await axios.get(followersUrl);
      const followersData = followersRes.data;
      for (let i = 0; i < followersData.data.openid.length; i++) {
        const userProfile = await axios.get(userProfileApi(followersData.data.openid[i]));
        result.push(userProfile.data);
      }
      res.setHeader('Content-Type', 'application/json');
    } catch (error) {
      console.log(error);
    } finally {
      res.end(JSON.stringify(result));
    }
}

app.get('/followers', getFollowers);

async function sendMessage(messageDetails) {
  console.log('Request is: ', messageDetails);
  const message = {
    "touser": messageDetails.recipient,
    "msgtype": "text",
    "text":
    {
      "content": messageDetails.message
    }
  };
  const serviceMessageUrl = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
  let resData = 'No response';
  try {
    const response = await axios.post(serviceMessageUrl, message);
    resData = response.data;
  } catch (error) {
    console.log('Error hitting message service', error);
    resData = error.message || 'Error hitting message service';
  }
  return resData;
}

app.post('/sendMessage', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  sendMessage(req.body).then(resData => {
    res.end(JSON.stringify(resData));
  }).catch(error => {
    res.end(JSON.stringify({ error: 'Error occured while sending message' }));
  });
});
var port = process.env.PORT || '3000';
app.set('port', port);


/**
 * Create HTTP server.
 */

var server = http.createServer(app);
const io = require('socket.io')(server, { origins: '*:*' });
io.on("connection", socket => {
  // Log whenever a user connects
  console.log("user connected");
  socket.emit("message", { type: "new-message", text: "Hi! You're connected to the socket" });

  // Log whenever a client disconnects from our websocket server
  socket.on("disconnect", function () {
    console.log("user disconnected");
  });

  // When we receive a 'message' event from our client, print out
  // the contents of that message and then echo it back to our client
  // using `io.emit()`
  socket.on("message", message => {
    console.log("Message Received: " + message);
    try {
      const parsedMessage = JSON.parse(message);
      sendMessage(parsedMessage).then(res => {
        io.emit("message", { type: "new-message", text: parsedMessage.message });
      });
    } catch (error) {
      console.log('Not a valid format');
    }
  });
});

// server.on('error', onError);
server.on('listening', onListening);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
  let expiryTime = 60;
  if (!accessToken) {
    accessToken = getAccessToken().then(({ token, expiryTime }) => {
      console.log('Access token stored', accessToken);
      setTimeout(getAccessToken, Math.max(expiryTime - 60, 60) * 1000);
    }).catch(error => {
      console.log('Access token not stored', accessToken);
      setTimeout(getAccessToken, Math.max(expiryTime - 60, 60) * 1000);
    });
  } else {
    console.log('Access token is', accessToken);
  }
  setTimeout(getAccessToken, Math.max(expiryTime - 60, 60) * 1000);
}
module.exports = app;
