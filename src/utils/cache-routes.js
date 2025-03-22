"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheRoutes = cacheRoutes;
const express_cache_controller_1 = __importDefault(require("express-cache-controller"));
function cacheRoutes() {
    return (0, express_cache_controller_1.default)({
        maxAge: 3600, // Cache for 1 hour
        public: true, // Cache can be stored by public caches (e.g., CDNs, browsers)
        mustRevalidate: true // Must revalidate with the server when expired
    });
}
;
