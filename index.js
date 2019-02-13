require('dotenv').config();
const express = require('express');
const http = require('http');
// const wechat = require('wechat'); // Github: https://github.com/node-webot/wechat

const bodyParser = require('body-parser')
require('body-parser-xml')(bodyParser)

const app = express()
app.use(bodyParser.xml())
// const router = express.Router();

const config = {
  token: process.env.TOKEN,
  appid: process.env.APP_ID,
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

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.end('WeChat Server Running');
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

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}
module.exports = app;
