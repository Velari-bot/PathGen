"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextjsFunc = void 0;
const https_1 = require("firebase-functions/v2/https");
const server_1 = require("next/server");
// Import all API routes
const route_1 = __importDefault(require("../src/app/api/osirion/stats/route"));
const route_2 = __importDefault(require("../src/app/api/test-credit-deduction/route"));
const route_3 = __importDefault(require("../src/app/api/health/route"));
const route_4 = __importDefault(require("../src/app/api/get-credits/route"));
const route_5 = __importDefault(require("../src/app/api/reset-usage/route"));
// Helper function to convert Firebase request to Next.js request
function createNextRequest(req) {
    const url = new URL(req.url);
    return new server_1.NextRequest(url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
    });
}
// Helper function to convert Next.js response to Firebase response
function sendNextResponse(res, nextResponse) {
    res.status(nextResponse.status);
    // Set headers
    nextResponse.headers.forEach((value, key) => {
        res.set(key, value);
    });
    // Send body
    if (nextResponse.body) {
        res.send(nextResponse.body);
    }
    else {
        res.end();
    }
}
// Main Next.js function handler
exports.nextjsFunc = (0, https_1.onRequest)(async (req, res) => {
    try {
        const url = new URL(req.url);
        const pathname = url.pathname;
        console.log(`🔍 Handling request: ${req.method} ${pathname}`);
        // Route to appropriate handler
        if (pathname.startsWith('/api/osirion/stats')) {
            const nextReq = createNextRequest(req);
            const nextRes = await (0, route_1.default)(nextReq);
            sendNextResponse(res, nextRes);
        }
        else if (pathname.startsWith('/api/test-credit-deduction')) {
            const nextReq = createNextRequest(req);
            const nextRes = await (0, route_2.default)(nextReq);
            sendNextResponse(res, nextRes);
        }
        else if (pathname.startsWith('/api/health')) {
            const nextReq = createNextRequest(req);
            const nextRes = await (0, route_3.default)(nextReq);
            sendNextResponse(res, nextRes);
        }
        else if (pathname.startsWith('/api/get-credits')) {
            const nextReq = createNextRequest(req);
            const nextRes = await (0, route_4.default)(nextReq);
            sendNextResponse(res, nextRes);
        }
        else if (pathname.startsWith('/api/reset-usage')) {
            const nextReq = createNextRequest(req);
            const nextRes = await (0, route_5.default)(nextReq);
            sendNextResponse(res, nextRes);
        }
        else {
            res.status(404).json({ error: 'API route not found' });
        }
    }
    catch (error) {
        console.error('❌ Error in nextjsFunc:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//# sourceMappingURL=nextjs-handler.js.map