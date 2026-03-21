import { PrismaClient } from '@prisma/client';
import express from 'express';
import { prisma } from './lib/prisma.js';

const app = express()

app.get('/', (req, res) => {
    res.send({
        msg: "healthy"
    });
})

app.get('/signup', (req, res) => {
    
})

app.listen(3000);