/**
 * svg Header
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
export function svgHeader(width: number, height: number): string;
/**
 * svg Styles block
 * @param  {...string} styles
 * @returns {string}
 */
export function svgStyles(...styles: string[]): string;
/**
 * svg Style Font definition
 * @returns {Promise<string>}
 */
export function svgDevtoberfestFont(): Promise<string>;
/**
 * svg Style header
 * @returns {string}
 */
export function svgStyleHeader(): string;
/**
 * svg Style bold
 * @returns {string}
 */
export function svgStyleBold(): string;
/**
 * svg Style stat
 * @returns {string}
 */
export function svgStyleStat(): string;
/**
 * svg Style error
 * @returns {string}
 */
export function svgStyleError(): string;
/**
 * svg Style stagger
 * @returns {string}
 */
export function svgStyleStagger(): string;
/**
 * svg Style icon
 * @returns {string}
 */
export function svgStyleIcon(): string;
/**
 * svg Style annimations
 * @returns {string}
 */
export function svgStyleAnimate(): string;
/**
 * svg Background rectangle
 * @returns {string}
 */
export function svgBackground(): string;
/**
 * svg Background rectangle
 * @returns {string}
 */
export function svgDevtoberfestBackground(): string;
/**
 * Image Header
 * @param {string} text
 * @returns {Promise<string>}
 */
export function svgContentHeader(text: string): Promise<string>;
/**
 * Error Image Header
 * @param {string} text
 * @returns {Promise<string>}
 */
export function svgErrorHeader(text: string): Promise<string>;
/**
 * svg Final End
 * @returns {string}
 */
export function svgEnd(): string;
/**
 * svg Main Content Body
 * @param  {...string} content
 * @returns {string}
 */
export function svgMainContent(...content: string[]): string;
/**
 * Render an Activity Item
 * @param {number} height
 * @param {number} delay - animation delay in milliseconds
 * @param {string} image - Base64 encoded image data
 * @param {string} title
 * @param {string} value
 * @param {boolean} [png] - alter rendering for png
 * @returns {string}
 */
export function svgActivityItem(height: number, delay: number, image: string, title: string, value: string, png?: boolean): string;
/**
 * Render a Devtoberfest Item
 * @param {number} x
 * @param {number} y
 * @param {number} delay - animation delay in milliseconds
 * @param {string} image - Base64 encoded image data
 * @param {number} scaleX - Scale image X coordinate
 * @param {number} scaleY - Scale image Y coordinate
 * @param {boolean} [png] - alter rendering for png
 * @param {string} [animation] - Special Animation
 * @param {string} [onclick] - onclick event handler
 * @param {string} [style] - custom style

 * @returns {string}
 */
export function svgDevtoberfestItem(x: number, y: number, delay: number, image: string, scaleX: number, scaleY: number, png?: boolean, animation?: string, onclick?: string, style?: string): string;
/**
 * Render a Devtoberfest Text Header
 * @param {number} height
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} title
 * @param {boolean} [png] - alter rendering for png
 * @param {string} [cssClass] - CSS Class
 * @returns {string}
 */
export function svgDevtoberfestTextHeader(height: number, width: number, delay: number, title: string, png?: boolean, cssClass?: string): string;
/**
 * Render a Devtoberfest Text Header
 * @param {number} height
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} title
 * @param {boolean} [png] - alter rendering for png
 * @returns {string}
 */
export function svgDevtoberfestCRTText(height: number, width: number, delay: number, title: string, png?: boolean): string;
/**
 * Render a Devtoberfest Text Item
 * @param {number} height
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} title
 * @param {boolean} [png] - alter rendering for png
 * @returns {string}
 */
export function svgDevtoberfestTextItem(height: number, width: number, delay: number, title: string, png?: boolean): string;
/**
 * Render a Devtoberfest Text Item
 * @param {number} height
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} title
 * @param {boolean} [png] - alter rendering for png
 * @returns {string}
 */
export function svgDevtoberfestTextLink(height: number, width: number, delay: number, title: string, link: any, png?: boolean): string;
/**
 * Render a Devtoberfest Text Item
 * @param {number} height
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} title
 * @param {boolean} [png] - alter rendering for png
 * @returns {string}
 */
export function svgDevtoberfestCRTLink(height: number, width: number, delay: number, title: string, link: any, png?: boolean): string;
/**
 * Render a Badge Showcase Item
 * @param {number} height
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} image - Base64 encoded image data
 * @param {string} title
 * @param {boolean} [png] - alter rendering for png
 * @returns {Promise<string>}
 */
export function svgBadgeItem(height: number, width: number, delay: number, image: string, title: string, png?: boolean): Promise<string>;
/**
 * Render a Badge Showcase Item 2nd line when wrapped
 * @param {number} height
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} title
 * @param {boolean} [png] - alter rendering for png
 * @returns {Promise<string>}
 */
export function svgBadgeItemSecond(height: number, width: number, delay: number, title: string, png?: boolean): Promise<string>;
/**
 * Load Local Image as Base64
 * @param {string} image
 * @returns {Promise<string>}
 */
export function loadImageB64(image: string): Promise<string>;
/**
 * Render Error Details
 * @param {number} height
 * @param {number} delay - animation delay in milliseconds
 * @param {string} text
 * @param {boolean} [png] - alter rendering for png
 * @returns {string}
 */
export function svgErrorDetails(height: number, delay: number, text: string, png?: boolean): string;
