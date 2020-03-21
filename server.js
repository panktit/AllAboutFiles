const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const dt = require('./date');
const filter = require('./filter');
const fs = require('fs');
const readline = require('readline');

app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
app.get('/',function(req,res){
  res.sendFile(__dirname + '/index.html');
});

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

app.post('/singleFile', (req, res) => {
  let upload = multer({ storage: storage }).single('singleFile');
  upload(req, res, function(err) {
    if (req.fileValidationError) {
      return res.send(req.fileValidationError);
    }
    else if (!req.file) {
      return res.send('Please select a file to upload');
    }
    else if (err instanceof multer.MulterError) {
      return res.send(err);
    }
    else if (err) {
      return res.send(err);
    }
    res.send(`File uploaded successfully <hr /><a href="./">Upload another file</a>`);
  });
});

app.post('/multipleFiles', (req, res) => {
  let upload = multer({ storage: storage }).array('multipleFiles', 10);
  upload(req, res, function(err) {
      if (req.fileValidationError) {
        return res.send(req.fileValidationError);
      }
      else if (!req.files) {
        return res.send('Please select files to upload');
      }
      else if (err) {
        return res.send(err);
      }
      res.send(`${req.files.length} files uploaded successfully <hr /><a href="./">Upload more files</a>`);
  });
});

app.post('/imageFile', (req, res) => {
    let upload = multer({ storage: storage, fileFilter: filter.imageFilter }).single('imageFile');
    upload(req, res, function(err) {
        if (req.fileValidationError) {
          return res.send(req.fileValidationError);
        }
        else if (!req.file) {
          return res.send('Please select an image to upload');
        }
        else if (err instanceof multer.MulterError) {
          return res.send(err);
        }
        else if (err) {
          return res.send(err);
        }
        res.send(`Image uploaded successfully <hr /><a href="./">Upload another image</a>`);
    });
});

app.get('/fileOps',function(req,res) {
  res.sendFile(path.join(__dirname+'/fileOps.html'));
});

app.post('/file-operation', (req,res) => {
    const operation = req.body.operation;
    const path = req.body.filename;
    if(operation == "checkperm") {
      //set file permissions
      fs.chmodSync(path, 444);

      // checks execute permission
      if (fs.existsSync(path)) {
        fs.access(path, fs.constants.X_OK, (err) => {
          if (err) {
            console.log(`No execute permissions for ${path}`);
          } else {
            console.log(`Execute permissions for ${path}`);
          }
        });
        // Check if we have read/write permissions
        // When specifying multiple permission modes
        // each mode is separated by a pipe : `|`
        fs.access(path, fs.constants.R_OK , (err) => {
            if (err) {
              console.log(`No read permissions for ${path}`);
            } else {
              console.log(`Read permissions for ${path}`);
            }
        });

        fs.access(path, fs.constants.W_OK , (err) => {
            if (err) {
              console.log(`No write permissions for ${path}`);
            } else {
              console.log(`Write permissions for ${path}`);
            }
        });
        res.send(`Check command prompt!<hr /><a href="./fileOps">Check another file</a>`);
      } else {
        res.send(`<br><br>File does not exist<hr /><a href="./fileOps">Check another file</a>`);
      }
    }
    else if(operation == "checkexist") {
      try {
        if (fs.existsSync(path)) {
          res.send(`${path} exists<hr/><a href="./">Check another file</a>`);
        } else {
          res.send(`${path} does not exist<hr/><a href="./">Check another file</a>`);
        }
      } catch(e) {
        res.send(`An error occurred<hr/><a href="./">Check another file</a>`);
      }
    }
    else if(operation == "linecount") {
      if (fs.existsSync(path)) {
        var linesCount = 0;
        var rl = readline.createInterface({
            input: fs.createReadStream(path),
            output: process.stdout,
            terminal: false
        });
        rl.on('line', function (line) {
            linesCount++; // on each linebreak, add +1 to 'linesCount'
        });
        rl.on('close', function () {
            res.send(`Total number of lines: ${linesCount}<hr/><a href="./">Check another file</a>`); // print the result when the 'close' event is called
        });
      } else {
        res.send(`File does not exist<hr /><a href="./fileOps">Check another file</a>`);
      }
    }
    else if(operation == "readlbl") {
      if (fs.existsSync(path)) {
        const rl = readline.createInterface({
            input: fs.createReadStream(path),
            output: process.stdout,
            terminal: false
        });
        rl.on('line', (line) => {
          console.log(line);
        });
        res.send(`Check command prompt!<hr /><a href="./fileOps">Go Back</a>`);
      } else {
        res.send(`File does not exist<hr /><a href="./fileOps">Check another file</a>`);
      }
    }
    else{
      res.send(`Select an appropriate option! <hr /><a href="./fileOps">Try Again</a>`);
    }
});

app.get('/cliInput',function(req,res) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  var response;
  rl.question("Enter your name: ", function (answer) {
      response = answer;
      outside();
      rl.close();
      res.send(`Check command prompt!<hr /><a href="./fileOps">Go Back</a>`);
  });
  outside = function() {
    console.log('Hi', response,'!');
  }
});

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);  

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('./error.html');
});


app.listen(port, () => console.log(`Listening on port ${port}...`));