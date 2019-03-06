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

const projectName = __dirname.split(path.sep).pop();
const staticDirectory = `${__dirname}${path.sep}dist${path.sep}${projectName}`;
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
  const tokenUrl = `https://api.wechat.com/cgi-bin/token?grant_type=client_credential&appid=${config.appid}&secret=${config.appsecret}`;
  let token = null;
  try {
    const response = await axios.get(tokenUrl);
    if ('access_token' in response) {
      token = response['access_token'];
    } else {
      throw new Error('Invalid request');
    }
  } catch (error) {
    console.log(error);
  } finally {
    console.log('Access Token is: ', token);
  }
  return token;
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
const handleText = (res, xml) => {
    let content = xml.Content[0];
          let reply = content;
          content = content.toLowerCase();
          switch(content) {
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
    )
    console.log(`WeChat - Responding with: ${msg}`)
    return res.send(msg)
}
const handleEvent = (res, xml) => {
  const [event] = xml.Event
  if (event === 'subscribe') {
    const msg = createMessage(
      xml.FromUserName[0],
      xml.ToUserName[0],
      'Welcome to our Official Account!',
    )
    console.log(`WeChat - Responding with: ${msg}`)
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

app.post('/sendMessage', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  console.log('Request is: ', req.body);
  res.end('Hello');
});
var port = process.env.PORT || '3000';
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

// server.on('error', onError);
server.on('listening', onListening);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);

/**
 * Event listener for HTTP server "listening" event.
 */

async function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
  if (!accessToken) {
    accessToken = await getAccessToken();
    fs.writeFile('access-token.txt', accessToken, {encoding: 'utf8'});
  }
}
module.exports = app;
