import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
}

export interface AdminConfig {
  name: string;
  email: string;
  password: string;
}

/**
 * Test connection to MySQL server
 */
export async function testMySQLConnection(config: DatabaseConfig): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const connection = await mysql.createConnection({
      host: config.host || 'localhost',
      port: Number(config.port) || 3306,
      user: config.user,
      password: config.password || '',
      database: config.database,
      connectTimeout: 7000,
    });

    await connection.ping();
    await connection.end();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to connect to MySQL database',
    };
  }
}

/**
 * Automatically create all necessary PostCraft tables in MySQL
 */
export async function createMySQLTables(config: DatabaseConfig): Promise<{
  success: boolean;
  error?: string;
}> {
  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection({
      host: config.host || 'localhost',
      port: Number(config.port) || 3306,
      user: config.user,
      password: config.password || '',
      database: config.database,
      multipleStatements: true,
    });

    // 1. User table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`User\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`password\` VARCHAR(255) NOT NULL,
        \`name\` VARCHAR(191) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`User_email_key\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. SocialAccount table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`SocialAccount\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`userId\` VARCHAR(36) NOT NULL,
        \`platform\` VARCHAR(50) NOT NULL DEFAULT 'FACEBOOK',
        \`accountId\` VARCHAR(191) NOT NULL,
        \`name\` VARCHAR(191) NOT NULL,
        \`avatar\` TEXT NULL,
        \`accessToken\` TEXT NOT NULL,
        \`category\` VARCHAR(191) NULL,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`SocialAccount_userId_platform_accountId_key\` (\`userId\`, \`platform\`, \`accountId\`),
        CONSTRAINT \`SocialAccount_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Post table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`Post\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`userId\` VARCHAR(36) NOT NULL,
        \`accountId\` VARCHAR(36) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`mediaUrl\` TEXT NULL,
        \`mediaType\` VARCHAR(50) NOT NULL DEFAULT 'TEXT',
        \`reactionsCount\` INT NOT NULL DEFAULT 0,
        \`commentsCount\` INT NOT NULL DEFAULT 0,
        \`lastPolledAt\` DATETIME(3) NULL,
        \`scheduledAt\` DATETIME(3) NULL,
        \`publishedAt\` DATETIME(3) NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
        \`platformPostId\` VARCHAR(191) NULL,
        \`platformPostUrl\` TEXT NULL,
        \`errorMessage\` TEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`Post_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`Post_accountId_fkey\` FOREIGN KEY (\`accountId\`) REFERENCES \`SocialAccount\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Comment table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`Comment\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`postId\` VARCHAR(36) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`delayMinutes\` INT NOT NULL DEFAULT 0,
        \`scheduledAt\` DATETIME(3) NULL,
        \`publishedAt\` DATETIME(3) NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        \`platformCommentId\` VARCHAR(191) NULL,
        \`errorMessage\` TEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`Comment_postId_fkey\` FOREIGN KEY (\`postId\`) REFERENCES \`Post\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. MilestoneTrigger table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`MilestoneTrigger\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`postId\` VARCHAR(36) NOT NULL,
        \`type\` VARCHAR(50) NOT NULL,
        \`threshold\` INT NOT NULL,
        \`commentText\` TEXT NOT NULL,
        \`isTriggered\` TINYINT(1) NOT NULL DEFAULT 0,
        \`triggeredAt\` DATETIME(3) NULL,
        \`platformCommentId\` VARCHAR(191) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`MilestoneTrigger_postId_fkey\` FOREIGN KEY (\`postId\`) REFERENCES \`Post\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. AutoReplyRule table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`AutoReplyRule\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`postId\` VARCHAR(36) NOT NULL,
        \`isEnabled\` TINYINT(1) NOT NULL DEFAULT 1,
        \`replyText\` TEXT NOT NULL,
        \`lastRepliedCommentId\` VARCHAR(191) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`AutoReplyRule_postId_key\` (\`postId\`),
        CONSTRAINT \`AutoReplyRule_postId_fkey\` FOREIGN KEY (\`postId\`) REFERENCES \`Post\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.end();
    return { success: true };
  } catch (error: any) {
    if (connection) await connection.end();
    return {
      success: false,
      error: error?.message || 'Failed to create database tables in MySQL',
    };
  }
}

/**
 * Seed Administrator Account into the newly installed MySQL database
 */
export async function createAdminUser(
  config: DatabaseConfig,
  admin: AdminConfig
): Promise<{ success: boolean; error?: string }> {
  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection({
      host: config.host || 'localhost',
      port: Number(config.port) || 3306,
      user: config.user,
      password: config.password || '',
      database: config.database,
    });

    const hashedPassword = await bcrypt.hash(admin.password, 10);
    const userId = crypto.randomUUID();

    // Insert or update Admin
    await connection.query(
      `INSERT INTO \`User\` (\`id\`, \`email\`, \`password\`, \`name\`, \`createdAt\`, \`updatedAt\`)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE \`password\` = VALUES(\`password\`), \`name\` = VALUES(\`name\`)`,
      [userId, admin.email.toLowerCase().trim(), hashedPassword, admin.name.trim()]
    );

    await connection.end();
    return { success: true };
  } catch (error: any) {
    if (connection) await connection.end();
    return {
      success: false,
      error: error?.message || 'Failed to create admin user',
    };
  }
}