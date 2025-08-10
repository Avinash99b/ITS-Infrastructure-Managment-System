import {GenericContainer, StartedTestContainer} from 'testcontainers';
import {execSync} from 'child_process';
import {Pool} from 'pg';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import dotenv from 'dotenv';
import Docker from "dockerode";

module.exports = async function() {
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

    console.log("Test database setup complete. Container ID:", container.getId());
}