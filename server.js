require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
const { Schema } = mongoose;
const app = express();
var bodyParser = require('body-parser')
const dns = require('dns');
app.use(bodyParser.urlencoded({ extended: false }))

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

//Url Logic
const urlSchema = new Schema({
  original_url: String,
  short_url: Number,
})

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const DBURL = mongoose.model('url', urlSchema);
//Set Url
app.post('/api/shorturl/new', function (req, res) {

  try {
    //check if url correct format
    const url = new URL(req.body.url);
    //check protocol

    if (url.protocol === "https:" || url.protocol === "http:") {
      //check if url verified
      dns.lookup(url.host, function (err, address, family) {
        //invalid url
        if (err) {
        
          res.json({ error: 'invalid url' });
          return err
        } else {
          //valid url
          //search url
          DBURL.findOne({ original_url: req.body.url }, function (err, data) {
            if (err) {
              return err;
            } else {
              //if url doesn't exist
              if (data === null) {
                DBURL.countDocuments({}, function (err, data) {
                  if (err) {
                    return err
                  } else {
                    //insert url in database
                    const newUrl = new DBURL({ 'original_url': req.body.url, 'short_url': data });
                    newUrl.save(function (err, data) {
                      if (err) {
                        return err
                      } else {
                        //and return to user
                        res.json({ 'original_url': req.body.url, 'short_url': data.short_url })
                      }
                    })

                  }
                })
              } else {
                //if url exists
                res.json({ 'original_url': data.original_url, 'short_url': data.short_url })
              }
            }
          });
        }
      })
    } else {
      //invalid protocol
      res.json({ error: 'invalid url' })
    }

  } catch (err) {
    //invalid url
    res.json({ error: 'invalid url' })
  }
})



//Redirect Url 
app.get('/api/shorturl/:short_url?', function (req, res) {

  //check if param vali
  if (isNaN(Number(req.params.short_url))) {
    res.json({ error: 'Invalid short url' })
  } else {
    //search for short url
    DBURL.findOne({
      'short_url': Number(req.params.short_url)
    }, function (err, data) {
      if (err) {
        return err
      } else {
        //if url doesnt exist
        if (data === null) {
          res.json({ error: "this short url doesn't exist" })
        } else {
          //if url exists
          res.status(301).redirect(data.original_url)
        }

      }
    })
  }
})
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
