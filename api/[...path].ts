/**
 * Vercel Serverless Function — catch-all สำหรับ /api/*
 * logic จริงทั้งหมดอยู่ใน ./_lib/api.ts (handleRequest)
 */
import { createHandler } from './_lib/handler.js'

export default createHandler()
