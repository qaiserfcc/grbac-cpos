#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Fetch OpenAPI spec from backend and save to frontend
 */
async function generateOpenAPISpec() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
  const specUrl = `${backendUrl}/api-docs/json`;

  console.log(`Fetching OpenAPI spec from: ${specUrl}`);

  try {
    const spec = await fetchSpec(specUrl);
    const frontendPublicDir = path.join(__dirname, '..', 'frontend', 'public');
    const outputPath = path.join(frontendPublicDir, 'openapi.json');

    // Ensure frontend/public directory exists
    if (!fs.existsSync(frontendPublicDir)) {
      fs.mkdirSync(frontendPublicDir, { recursive: true });
    }

    // Write the spec to file
    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
    console.log(`✅ OpenAPI spec saved to: ${outputPath}`);
    console.log(`📖 You can now access the API documentation at: ${backendUrl}/api-docs`);
  } catch (error) {
    console.error('❌ Failed to generate OpenAPI spec:', error.message);
    process.exit(1);
  }
}

/**
 * Fetch spec from URL
 */
function fetchSpec(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;

    const request = client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const spec = JSON.parse(data);
          resolve(spec);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run the script
if (require.main === module) {
  generateOpenAPISpec();
}

module.exports = { generateOpenAPISpec };