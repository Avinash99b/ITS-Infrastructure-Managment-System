// types/express.d.ts

import {ResponseUserModel, UserModel} from "../models/userModel";

declare global {
    namespace Express {
        interface Request {
            user?: UserModel; // or just user: IUser if you always expect it to be there
        }
    }
}
