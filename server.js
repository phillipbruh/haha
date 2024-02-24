// app.js

const express = require('express');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');
const rateLimit = require('express-rate-limit');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

let linkCounters = {};
let linkBalance = {};
// Load link counters from JSON file on server startup
try {
  linkCounters = JSON.parse(fs.readFileSync('linkCounters.json', 'utf8'));
} catch (err) {
  console.error('Error loading link counters:', err);
}
console.log("aa")
try {
  linkBalance = JSON.parse(fs.readFileSync('linkBalance.json', 'utf8'));
  console.log(linkBalance)
} catch (err) {
  console.error('Error loading link counters:', err);
}

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware to update link counters
const updateLinkCounter = (req, res, next) => {
  const query = url.parse(req.url).query;
  const params = querystring.parse(query);
  const affiliate = params.affiliate;

  if (affiliate && linkCounters[affiliate]) {
    linkCounters[affiliate]++;
    // Save link counters to JSON file
    fs.writeFile('linkCounters.json', JSON.stringify(linkCounters), (err) => {
      if (err) {
        console.error('Error saving link counters:', err);
      }
    });
  }

  next();
};
const updateLinkBalance = (req, res, next) => {
  const query = url.parse(req.url).query;
  const params = querystring.parse(query);
  const affiliate = params.affiliate;

  if(linkBalance[affiliate] == null) {
    linkBalance[affiliate] = 1;
  }
  else {
    linkBalance[affiliate] = linkBalance[affiliate]+.01 ;
  }
  
  // Save link counters to JSON file
  fs.writeFile('linkBalance.json', JSON.stringify(linkBalance), (err) => {
    if (err) {
      console.error('Error saving link Balance:', err);
    }
  });
  

  next();
};

// Rate limiting middleware for updating link counters
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 4
});

// Route for accessing links with rate limiting


// Dashboard route to display link counters and form to create links
app.get('/getLink/:linkC', (req, res) => {
  const { linkC } = req.params;
 

  res.send(`

    
      ${Object.entries(linkCounters).filter(([link, count, balance]) => link === linkC).map(([link, count, balance]) => `${count}`).join('')}
  `);
  // 
 
});
app.get('/getBal/:linkC', (req, res) => {
  const { linkC } = req.params;
 

  res.send(`

    
      ${Object.entries(linkBalance).filter(([link, count, balance]) => link === linkC).map(([link, count, balance]) => `${count}`).join('')}
  `);
  // 
 
});


// Route to create new links and update counters
app.post('/create-link', (req, res) => {
  const { link } = req.body;
  if (!link) {
    return res.status(400).send('Link parameter is required');
  }

  if (!linkCounters[link]) {
    linkCounters[link] = 0;
  }

  // Save link counters to JSON file
  fs.writeFile('linkCounters.json', JSON.stringify(linkCounters), (err) => {
    if (err) {
      console.error('Error saving link counters:', err);
    }
  });

  res.redirect('/dashboard');
});

app.get('/invite', limiter, updateLinkCounter, updateLinkBalance, (req, res, next) => {
  if (req.rateLimit.remaining === 0) {
    // Handle rate limit exceeded
    console.log('Rate limit exceeded');
    // You can send a custom response or just continue to the next middleware
    next();
    
  } else {
    // Continue processing the request
    res.redirect('/home')
    //res.send('Link count updated');
    
  }
  
});
app.get('/home', limiter, updateLinkCounter, (req, res, next) => {
   res.send("bruh")
  }
  
);
app.get('/css/:file', (req, res, next) => {
   const file = req.params.file;
   res.sendFile('css/'+file, {root: __dirname })
  }
  
);
app.get('/js/:file', (req, res, next) => {
   const file = req.params.file;
   res.sendFile('js/'+file, {root: __dirname })
  }
  
);

app.get('/dashboard/:link', (req, res) => {
  
  const { link } = req.params;
  if (!linkCounters[link]) {
    return res.status(404).send('Link nojt found');
  }
  //res.sendFile("index.html", {root: __dirname })
   res.writeHead(200, { 'content-type': 'text/html' })
   fs.createReadStream('index.html').pipe(res)
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});