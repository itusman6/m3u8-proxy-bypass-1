"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const m3u8_proxy_1 = require("../controllers/m3u8-proxy");
exports.router = express_1.default.Router();
exports.router.get('/m3u8-proxy', m3u8_proxy_1.m3u8Proxy);
