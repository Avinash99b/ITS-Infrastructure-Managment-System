import db from "../src/components/db";
import {UserModel} from "../src/models/userModel";
import bcrypt from "bcryptjs";


const PASSWORD_SALT_ROUNDS = process.env.PASSWORD_SALT_ROUNDS ? parseInt(process.env.PASSWORD_SALT_ROUNDS) : 10;

export async function insertTestUsers() {
    const users:{name:string,email:string,mobileNo:string,password:string}[] =[]
    for (let i = 0; i < 1000; i++) {
        const password = `Password@${i}`
        const hashed = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
        await db.raw("Insert into users(name, email, mobile_no, password_hash) VALUES (?,?,?,?)", [`User ${i}`, `user${i}@gmail.com`, String(i).padStart(10, '132456789'), hashed])
        users.push({name: `User ${i}`, email: `user${i}@gmail.com`,mobileNo:String(i).padStart(10,"123456789"), password})
    }
    return users
}