var express = require("express");
var server = express();
var https = require('https');
var fs = require('fs');
var path = require('path');
var hostname = process.env.HOSTNAME || 'localhost';
var port = process.env.PORT || 8080;

// Only JSON middleware
server.use(express.json({ limit: '1mb' }));

// Serve index.html
server.get("/", function (req, res) {
    const filepath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filepath, 'utf8', function(err, data) {
        if (err) {
            res.status(404).send('Not found');
            return;
        }
        res.setHeader('Content-Type', 'text/html');
        res.send(data);
    });
});

// Serve other static files
server.get("/:file(*)", function (req, res) {
    const filepath = path.join(__dirname, 'public', req.params.file);
    
    // Security: prevent directory traversal
    const realpath = path.resolve(filepath);
    const publicdir = path.resolve(path.join(__dirname, 'public'));
    
    if (!realpath.startsWith(publicdir)) {
        return res.status(403).send('Forbidden');
    }
    
    fs.readFile(filepath, function(err, data) {
        if (err) {
            res.status(404).send('Not found');
            return;
        }
        
        // Set content type based on file extension
        const ext = path.extname(filepath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif'
        };
        
        res.setHeader('Content-Type', contentTypes[ext] || 'text/plain');
        res.send(data);
    });
});

// Hugging Face API endpoint
server.post("/api/chat", function (req, res) {
    try {
        const message = req.body?.message;
        const token = req.body?.token;
        
        if (!token || !message) {
            return res.status(400).json({ error: "Message and token required" });
        }

        const systemPrompt = `You are EpiCare, a compassionate support chatbot for people with epilepsy.`;

        const payload = JSON.stringify({
            inputs: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
            parameters: {
                max_new_tokens: 300,
                temperature: 0.7,
                top_p: 0.95
            }
        });

        const options = {
            hostname: 'router.huggingface.co',
            path: '/models/google/gemma-2-9b-it',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const hfReq = https.request(options, function(hfRes) {
            let data = '';

            hfRes.on('data', function(chunk) {
                data += chunk;
            });

            hfRes.on('end', function() {
                try {
                    if (hfRes.statusCode !== 200) {
                        if (hfRes.statusCode === 401) {
                            return res.status(401).json({ error: "Invalid API token" });
                        }
                        return res.status(hfRes.statusCode).json({ error: `API Error: ${hfRes.statusCode}` });
                    }

                    const jsonData = JSON.parse(data);
                    if (jsonData[0] && jsonData[0].generated_text) {
                        let text = jsonData[0].generated_text;
                        const idx = text.lastIndexOf('Assistant:');
                        if (idx !== -1) {
                            text = text.substring(idx + 10).trim();
                        }
                        return res.json({ response: text });
                    }
                    
                    res.json({ response: "I'm here to help." });
                } catch (e) {
                    res.status(500).json({ error: "Parse error" });
                }
            });
        });

        hfReq.on('error', function(error) {
            res.status(500).json({ error: "Request error" });
        });

        hfReq.write(payload);
        hfReq.end();
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Hugging Face API endpoint
server.post("/api/chat", function (req, res) {
    try {
        const message = req.body?.message;
        const token = req.body?.token;
        
        if (!token || !message) {
            return res.status(400).json({ error: "Message and token required" });
        }

        const systemPrompt = `You are EpiCare, a compassionate support chatbot for people with epilepsy.`;

        const payload = JSON.stringify({
            inputs: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
            parameters: {
                max_new_tokens: 300,
                temperature: 0.7,
                top_p: 0.95
            }
        });

        const options = {
            hostname: 'api-inference.huggingface.co',
            path: '/models/google/gemma-2-9b-it',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const hfReq = https.request(options, function(hfRes) {
            let data = '';

            hfRes.on('data', function(chunk) {
                data += chunk;
            });

            hfRes.on('end', function() {
                try {
                    if (hfRes.statusCode !== 200) {
                        if (hfRes.statusCode === 401) {
                            return res.status(401).json({ error: "Invalid API token" });
                        }
                        return res.status(hfRes.statusCode).json({ error: `API Error: ${hfRes.statusCode}` });
                    }

                    const jsonData = JSON.parse(data);
                    if (jsonData[0] && jsonData[0].generated_text) {
                        let text = jsonData[0].generated_text;
                        const idx = text.lastIndexOf('Assistant:');
                        if (idx !== -1) {
                            text = text.substring(idx + 10).trim();
                        }
                        return res.json({ response: text });
                    }
                    
                    res.json({ response: "I'm here to help." });
                } catch (e) {
                    res.status(500).json({ error: "Parse error" });
                }
            });
        });

        hfReq.on('error', function(error) {
            res.status(500).json({ error: "Request error" });
        });

        hfReq.write(payload);
        hfReq.end();
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

console.log("Server listening at http://" + hostname + ":" + port);

if (require.main === module) { 
    server.listen(port); 
} else { 
    module.exports = server; 
}
