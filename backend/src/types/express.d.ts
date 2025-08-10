// types/express.d.ts

import {RequestUserModel} from "../models/userModel";

declare global {
    namespace Express {
        interface Request {
            user?: RequestUserModel; // or just user: IUser if you always expect it to be there
        }
    }
}
