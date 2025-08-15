import {GenericContainer, StartedTestContainer} from 'testcontainers';
import {execSync} from 'child_process';
import {Pool} from 'pg';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import dotenv from 'dotenv';
import {Knex} from "knex";

module.exports = async function () {
    // Start Postgres container
    const container = await new GenericContainer("postgres")
        .withEnvironment({
            POSTGRES_USER: 'testuser',
            POSTGRES_PASSWORD: 'testpass',
            POSTGRES_DB: 'testdb',
        })
        .withExposedPorts(5432)
        .start();

    const host = container.getHost();
    const port = container.getMappedPort(5432);

    // Save container ID for teardown
    fs.writeFileSync(".containerId", container.getId());

    const connectionString = `postgresql://testuser:testpass@${host}:${port}/testdb`;

    // Write connection info to .testenv
    const envContent = `DATABASE_URL=${connectionString}
    NODE_ENV=test`;
    fs.writeFileSync(".testenv", envContent.trim());

    // Reload environment variables from .testenv
    dotenv.config({path: '.testenv'});

    // Run migrations
    execSync('npx knex migrate:latest', {
        stdio: 'inherit',
        env: {
            ...process.env,
            DATABASE_URL: connectionString,
        },
    });

    const db = require('../src/components/db').default as Knex
    await db('users').where('mobile_no', '1234567890').del(); // Clean up any existing test user
    await db.raw("Insert into users(name, email, mobile_no, password_hash, permissions) values ('Test User', 'testuser@gmail.com','1234567890','$2b$10$sJkse0Ol2teLBMCXX6GuEetSsMiKPW2N5ke9h8fpcqMPBUIdlNqCK','[\"*\"]')");

    await db.destroy()
    console.log("Test database setup complete. Container ID:", container.getId());
}