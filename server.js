// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webm': 'video/webm'
};

http.createServer((req, res) => {
    // Enable CORS for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let safeUrl = req.url.split('?')[0];

    // POST /upload-convert route for local FFmpeg processing
    if (req.method === 'POST' && safeUrl === '/upload-convert') {
        const id = Date.now();
        const tempDir = path.join(__dirname, '.temp_renders');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const inputPath = path.join(tempDir, `input_${id}.webm`);
        const outputPath = path.join(tempDir, `output_${id}.mp4`);

        // Check if FFmpeg is installed first
        const { exec } = require('child_process');
        exec('ffmpeg -version', (ffmpegError) => {
            if (ffmpegError) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: "FFmpeg is not installed on your system.\n\nTo enable high-quality MP4 (H.264, yuv420p) conversion, please install FFmpeg:\n- Windows (PowerShell/CMD): Run `winget install FFmpeg` and restart this server.\n- Mac (Terminal): Run `brew install ffmpeg`.\n- Linux: Run `sudo apt install ffmpeg`."
                }));
                return;
            }

            // Read the binary stream of the WebM file
            const fileWriteStream = fs.createWriteStream(inputPath);
            req.pipe(fileWriteStream);

            fileWriteStream.on('finish', () => {
                // Execute ffmpeg conversion
                // -y: overwrite output files without asking
                // -i: input file
                // -c:v libx264: H.264 video codec
                // -pix_fmt yuv420p: TouchDesigner compatible pixel format
                // -crf 18: high quality crf value
                const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -c:v libx264 -pix_fmt yuv420p -crf 18 "${outputPath}"`;
                
                exec(ffmpegCmd, (convError, stdout, stderr) => {
                    if (convError) {
                        console.error("FFmpeg conversion failed:", convError);
                        console.error(stderr);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: "FFmpeg conversion failed: " + convError.message
                        }));
                        // Cleanup input
                        try { fs.unlinkSync(inputPath); } catch (e) {}
                        return;
                    }

                    // Send the converted MP4 file
                    fs.readFile(outputPath, (readError, fileContent) => {
                        if (readError) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, error: "Failed to read converted MP4 file." }));
                        } else {
                            res.writeHead(200, { 
                                'Content-Type': 'video/mp4',
                                'Content-Disposition': `attachment; filename="vibe-visualizer-${id}.mp4"`,
                                'Cache-Control': 'no-cache'
                            });
                            res.end(fileContent);
                        }

                        // Cleanup temp files
                        try { fs.unlinkSync(inputPath); } catch (e) {}
                        try { fs.unlinkSync(outputPath); } catch (e) {}
                    });
                });
            });

            fileWriteStream.on('error', (err) => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: "Failed to save temporary WebM file." }));
                try { fs.unlinkSync(inputPath); } catch (e) {}
            });
        });
        return;
    }

    // Prevent directory traversal
    let filePath = path.join(__dirname, safeUrl === '/' ? 'index.html' : safeUrl);

    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            res.end(content, 'utf-8');
        }
    });
}).listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
