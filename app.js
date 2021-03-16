// * 티스토리API 사용을 위해서는, 먼저 티스토리 아이디로 로그인 적용이 필요합니다.
// * 처리한도 : 티스토리글쓰기: 건/일 (티스토리 계정당)
var express = require('express');
var app = express();
var request = require('request');

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({limit: '500mb', extended: true, parameterLimit: 10000000}));

var client_config  = require('./config/client-config.json');
var client_id = client_config.client_id;
var client_secret = client_config.client_secret;
var state = "RAMDOM_STATE";
var redirectURI = encodeURI(client_config.callback_url);
var api_url = "";

var token = "YOUR_ACCESS_TOKEN";
var refresh_token = "YOUR_REFRESH_TOKEN";
var header = ""; // Bearer 다음에 공백 추가


app.get('/tistorylogin', function (req, res) {
  api_url = 'https://www.tistory.com/oauth/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirectURI + '&state=' + state;
  res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
  res.end("<a href='"+ api_url + "'>티스토리 로그인</a>");
});
app.get('/callback', function (req, res) {
  code = req.query.code;
  state = req.query.state;
  api_url = 'https://www.tistory.com/oauth/access_token?grant_type=authorization_code&client_id='
      + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirectURI + '&code=' + code + '&state=' + state;

  var options = {
    url: api_url,
    headers: {'X-Tistory-Client-Id':client_id, 'X-Tistory-Client-Secret': client_secret}
  };
  request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
      console.log(body);
      console.log(typeof body);
      if(body){
        token = body.replace(/access_token=/gi,'');
        console.log(token);
        // refresh_token = JSON.parse(body).refresh_token;
        // header = "Bearer " + token;
      }
      res.end(body);
    } else {
      res.status(response.statusCode).end();
      console.log('error = ' + response.statusCode);
    }
  });
});

app.get('/refreshtoken', function (req, res) {
  code = req.query.code;
  state = req.query.state;
  api_url = 'https://www.tistory.com/oauth/access_token?grant_type=refresh_token&&client_id='
      + client_id + '&client_secret=' + client_secret + '&refresh_token=' + refresh_token;

  var options = {
    url: api_url,
    headers: {'X-Tistory-Client-Id':client_id, 'X-Tistory-Client-Secret': client_secret}
  };
  request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
      console.log(body);
      console.log(typeof body);
      if(JSON.parse(body)){
        token = JSON.parse(body).access_token;
        header = "Bearer " + token;

      }
      res.end(body);
    } else {
      res.status(response.statusCode).end();
      console.log('error = ' + response.statusCode);
    }
  });
});

app.get('/member', function (req, res) {
  var api_url = 'https://openapi.tistory.com/v1/nid/me';
  var options = {
    url: api_url,
    headers: {'Authorization': header}
  };
  request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
      res.end(body);
    } else {
      console.log('error');
      if(response != null) {
        res.status(response.statusCode).end();
        console.log('error = ' + response.statusCode);
      }
    }
  });
});


// var clubid = "CLUB_ID";// 티스토리의 고유 ID값
// var menuid = "MENU_ID"; // 티스토리게시판 id (상품게시판은 입력 불가)
// var subject = encodeURI("티스토리 티스토리api Test node js");
// var content = encodeURI("티스토리 티스토리api로 글을 티스토리에 글을 올려봅니다.");
app.post('/cafe/post', function (req, res) {
  var api_url = 'https://openapi.tistory.com/v1/cafe/' + req.body.clubid + '/menu/' + req.body.menuid + '/articles';
  var options = {
    url: api_url,
    form: {'subject':req.body.subject, 'content':req.body.content},
    headers: {'Authorization': header}
  };
  request.post(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
      res.end(body);
    } else {
      console.log('error');
      if(response != null) {
        res.status(response.statusCode).end();
        console.log('error = ' + response.statusCode);
      }
    }
  });
});


// var clubid = "YOUR_CAFE_ID";// 티스토리의 고유 ID값
// var menuid = "YOUR_CAFE_BBS_ID"; // 티스토리게시판 id (상품게시판은 입력 불가)
// var subject = encodeURI("티스토리 티스토리api Test node js");
// var content = encodeURI("node js multi-part 티스토리 티스토리api로 글을 티스토리에 글을 올려봅니다.");
var fs = require('fs');
app.post('/cafe/post/multipart', function (req, res) {
  var api_url = 'https://openapi.tistory.com/v1/cafe/' + req.body.clubid + '/menu/' + req.body.menuid + '/articles';
  var _formData = {};
  _formData.subject = req.body.subject;
  _formData.content = req.body.content;
  _formData.image = [];
  _formData.image[0] = {
    value: fs.createReadStream(req.body.filepath),
    options: { filename: req.body.filename,  contentType: 'image/png'}
  }
  if(req.body.filepath2){
    _formData.image[1] = {
      value: fs.createReadStream(req.body.filepath2),
      options: { filename: req.body.filename2,  contentType: 'image/png'}
    }
  }

  var _req = request.post({url:api_url, formData:_formData,
    headers: {'Authorization': header}}).on('response', function(response) {
    console.log(response.statusCode) // 200
    console.log(response.headers['content-type'])
  });
  console.log( request.head  );
  _req.pipe(res); // 브라우저로 출력
});


app.listen(3003, function () {
  console.log('http://127.0.0.1:3003/tistorylogin app listening on port 3003!');
});

