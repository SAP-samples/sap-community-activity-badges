/**
 * - instance of express module
 */
export type express = any;
/** @typedef {import("express")} express - instance of express module */
/**
 * Handle Errors, render them as images and output that image
 * @param {express.error} error - caught error object
 * @param {express.req} req
 * @param {express.res} res
 */
export function handleError(error: any, req: any, res: any): Promise<void>;
