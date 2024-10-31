import { Request, Response } from "express";

export default interface Controller
{
    execute(req: Request, res: Response): Promise<any>
}