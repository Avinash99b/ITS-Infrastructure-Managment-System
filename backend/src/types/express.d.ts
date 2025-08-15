// types/express.d.ts

import {ResponseUserModel} from "../models/userModel";

declare global {
    namespace Express {
        interface Request {
            user?: ResponseUserModel; // or just user: IUser if you always expect it to be there
        }
    }
}
