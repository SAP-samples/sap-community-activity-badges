// @ts-check
/**
 * @module svgRender - Utilities to help with the SVG Rendering
 */

let debug = require('debug')('scn-badges-svg-render')

/**
 * svg Header
 * @param {number} width 
 * @param {number} height 
 * @returns {string}
 */
function svgHeader(width, height) {

  let content =
    `<svg
    width="${width.toString()}"
    height="${height.toString()}"
    viewBox="0 0 ${width.toString()} ${height.toString()}"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink">\n`
  debug(content)
  return content
}
module.exports.svgHeader = svgHeader

/**
 * svg Styles block
 * @param  {...string} styles 
 * @returns {string}
 */
function svgStyles(...styles) {
  let content = '<style>\n'
  for (let style of styles) {
    content += style
  }
  content += '</style>\n'
  debug(content)
  return content
}
module.exports.svgStyles = svgStyles

/**
 * svg Style Font definition
 * @returns {Promise<string>}
 */
async function svgDevtoberfestFont() {
  return `
  @font-face {
      font-family: "Joystix Monospace";
      src: url("data:application/font-woff;charset=utf-8;base64,${await loadImageB64("../images/devtoberfest/fonts/joystix_monospace.ttf")}");
  }`

 /*  return `
  <style>
  @font-face {
      font-family: "Joystix Monospace";
      src: url("data:application/font-woff;charset=utf-8;base64,${await loadImageB64("../images/devtoberfest/fonts/joystix_monospace.ttf")}");
  }
  </style>
      \n` */
}
module.exports.svgDevtoberfestFont = svgDevtoberfestFont

/**
 * svg Style header
 * @returns {string}
 */
function svgStyleHeader() {
  return `
    .header {
        font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
        fill: #fff;
        animation: fadeInAnimation 0.8s ease-in-out forwards;
      }\n`
}
module.exports.svgStyleHeader = svgStyleHeader


/**
 * svg Style bold
 * @returns {string}
 */
function svgStyleBold() {
  return `
    .bold { font-weight: 700 }\n`
}
module.exports.svgStyleBold = svgStyleBold

/**
 * svg Style stat
 * @returns {string}
 */
function svgStyleStat() {
  return `
    .stat {
        font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: #9f9f9f;
    }\n`
}
module.exports.svgStyleStat = svgStyleStat

/**
 * svg Style error
 * @returns {string}
 */
function svgStyleError() {
  return `
    .error {
        font: 600 12px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: #9f9f9f;
    }\n`
}
module.exports.svgStyleError = svgStyleError

/**
 * svg Style stagger
 * @returns {string}
 */
function svgStyleStagger() {
  return `
    .stagger {
        opacity: 0;
        animation: fadeInAnimation 0.3s ease-in-out forwards;
    }\n`
}
module.exports.svgStyleStagger = svgStyleStagger

/**
 * svg Style icon
 * @returns {string}
 */
function svgStyleIcon() {
  return `
    .icon {
        fill: #79ff97;
        display: block;
    }\n`
}
module.exports.svgStyleIcon = svgStyleIcon

/**
 * svg Style annimations
 * @returns {string}
 */
function svgStyleAnimate() {
  return `
    @keyframes rankAnimation {
        from {
          stroke-dashoffset: 251.32741228718345;
        }
        to {
          stroke-dashoffset: 113.71626719291889;
        }
      }

      @keyframes scaleInAnimation {
        from {
          transform: translate(-5px, 5px) scale(0);
        }
        to {
          transform: translate(-5px, 5px) scale(1);
        }
      }
      @keyframes fadeInAnimation {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }\n`
}
module.exports.svgStyleAnimate = svgStyleAnimate

/**
 * svg Background rectangle
 * @returns {string}
 */
function svgBackground() {
  return `
        <rect
          data-testid="background"
          x="0.5"
          y="0.5"
          rx="4.5"
          height="99%"
          stroke="#e4e2e2"
          width="99%"
          fill="#151515"
          stroke-opacity="1"
        /> \n`
}
module.exports.svgBackground = svgBackground

/**
 * svg Background rectangle
 * @returns {string}
 */
function svgDevtoberfestBackground() {
  return `
        <rect
          data-testid="background"
          x="0"
          y="0"
          rx="0"
          height="100%"
          stroke="#e4e2e2"
          width="100%"
          fill="#E5E2DD"
          stroke-opacity="1"
        /> \n`
}
module.exports.svgDevtoberfestBackground = svgDevtoberfestBackground

/**
 * Image Header 
 * @param {string} text 
 * @returns {Promise<string>}
 */
async function svgContentHeader(text) {
  return `
    <g data-testid="title" transform="translate(25, 35)">
        <g transform="translate(0, 0)">
            <image x="-23" y="-33" class="header" href="data:image/png;base64,${await loadImageB64("../images/sap_18.png")}" height="25" width="50"/> 
        </g>
        <g transform="translate(0, 0)">
            <text x="25" y="0" class="header" data-testid="header">${text}</text>
        </g>
    </g>\n`
}
module.exports.svgContentHeader = svgContentHeader

/**
 * Error Image Header 
 * @param {string} text 
 * @returns {Promise<string>}
 */
async function svgErrorHeader(text) {
  return `
    <g data-testid="title" transform="translate(25, 35)">
        <g transform="translate(0, 0)">
            <image x="-23" y="-33" class="header" href="data:image/png;base64,${await loadImageB64("../images/sap_18.png")}" height="25" width="50"/> 
        </g>
        <g transform="translate(0, 0)">
        <image x="25" y="-15" class="icon" href="data:image/png;base64,${await loadImageB64("../images/error.png")}" height="18" width="18"/>    
 
            <text x="45" y="0" class="header" data-testid="header">${text}</text>
        </g>
    </g>\n`
}
module.exports.svgErrorHeader = svgErrorHeader


/**
 * svg Final End
 * @returns {string}
 */
function svgEnd() {
  return `
    </svg>    
    `
}
module.exports.svgEnd = svgEnd

/**
 * svg Main Content Body
 * @param  {...string} content 
 * @returns {string}
 */
function svgMainContent(...content) {
  let output = `
    <svg x="0" y="0">\n`

  for (let item of content) {
    output += item
  }

  output += `
    </svg>\n`
  debug(output)
  return output
}
module.exports.svgMainContent = svgMainContent

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
function svgActivityItem(height, delay, image, title, value, png = false) {

  let content =
    `
   <g transform="translate(0, ${height.toString()})">\n`

  if (png) {
    content += `
    <g transform="translate(25, 0)">
    `
  } else {
    content += `
    <g class="stagger" style="animation-delay: ${delay.toString()}ms" transform="translate(25, 0)">
    `
  }
  content += `
       <image class="icon" href="data:image/png;base64,${image}" height="18" width="18"/>    
       <text class="stat bold" x="25" y="12.5">${title}:</text>
       <text class="stat" x="190" y="12.5" >${value}</text>
       </g>
   </g>\n`

  return content

}
module.exports.svgActivityItem = svgActivityItem

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

 * @returns {string}
 */
function svgDevtoberfestItem(x, y, delay, image, scaleX, scaleY, png = false, animation, onclick) {
  let content =
    `
   <g transform="translate(${y.toString()}, ${x.toString()})">\n`

  if (png) {
    content += `
    <g transform="translate(0, 0)">
    `
  } else {
    content += `
    <g class="stagger" style="animation-delay: ${delay.toString()}ms" transform="translate(0, 0)">
    `
  }
  
  if(onclick){
    content += `
    <image ${onclick} class="icon" href="data:image/png;base64,${image}" height="${scaleX.toString()}" width="${scaleY.toString()}">\n`

  }else {
    content += `
    <image class="icon" href="data:image/png;base64,${image}" height="${scaleX.toString()}" width="${scaleY.toString()}">\n`

  }

  if (animation) {
    content += animation
  }

  content += `</image>    
       </g>
   </g>\n`

  return content

}
module.exports.svgDevtoberfestItem = svgDevtoberfestItem

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
 function svgDevtoberfestTextHeader(height, width, delay, title, png, cssClass) {
  let content =
    `
   <g transform="translate(${width.toString()}, ${height.toString()})">\n`

  if (png) {
    content += `
    <g transform="translate(0, 0)">
    `
  } else {
    content += `
    <g class="stagger" style="animation-delay: ${delay.toString()}ms" transform="translate(0, 0)">
    `
  }
  if(!cssClass){
    cssClass = `class="header"`
  }
  content += `
  <text ${cssClass}>${title}</text>
         </g>
   </g>\n`

  return content

}
module.exports.svgDevtoberfestTextHeader = svgDevtoberfestTextHeader

/**
 * Render a Devtoberfest Text Header
 * @param {number} height 
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} title 
 * @param {boolean} [png] - alter rendering for png
 * @returns {string}
 */
 function svgDevtoberfestCRTText(height, width, delay, title, png) {
  let content =
    `
   <g transform="translate(${width.toString()}, ${height.toString()})">\n`

  if (png) {
    content += `
    <g transform="translate(0, 0)">
    `
  } else {
    content += `
    <g class="stagger" style="animation-delay: ${delay.toString()}ms" transform="translate(0, 0)">
    `
  }
  content += `
  <text class="crt">${title}</text>
         </g>
   </g>\n`

  return content

}
module.exports.svgDevtoberfestCRTText = svgDevtoberfestCRTText


/**
 * Render a Devtoberfest Text Item
 * @param {number} height 
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} title 
 * @param {boolean} [png] - alter rendering for png
 * @returns {string}
 */
function svgDevtoberfestTextItem(height, width, delay, title, png) {
  let content =
    `
   <g transform="translate(${width.toString()}, ${height.toString()})">\n`

  if (png) {
    content += `
    <g transform="translate(0, 0)">
    `
  } else {
    content += `
    <g class="stagger" style="animation-delay: ${delay.toString()}ms" transform="translate(0, 0)">
    `
  }
  content += `
  <text class="devNormal">${title}</text>
         </g>
   </g>\n`

  return content

}
module.exports.svgDevtoberfestTextItem = svgDevtoberfestTextItem

/**
 * Render a Devtoberfest Text Item
 * @param {number} height 
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} title 
 * @param {boolean} [png] - alter rendering for png
 * @returns {string}
 */
 function svgDevtoberfestTextLink(height, width, delay, title, link, png) {
  let content =
    `
   <g transform="translate(${width.toString()}, ${height.toString()})">\n`

   let className = 'devLink'

  if (png) {
    className = 'devNormal'
    content += `
    <g transform="translate(0, 0)">
    `
  } else {
    content += `
    <g class="stagger" style="animation-delay: ${delay.toString()}ms" transform="translate(0, 0)">
    `
  }
  
  content += `
  <a xlink:href="${link}"
        target="_blank">
  <text class="${className}">${title}</text>
  </a>
         </g>
   </g>\n`

  return content

}
module.exports.svgDevtoberfestTextLink = svgDevtoberfestTextLink

/**
 * Render a Devtoberfest Text Item
 * @param {number} height 
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} title 
 * @param {boolean} [png] - alter rendering for png
 * @returns {string}
 */
 function svgDevtoberfestCRTLink(height, width, delay, title, link, png) {
  let content =
    `
   <g transform="translate(${width.toString()}, ${height.toString()})">\n`

   let className = 'crtLink'

  if (png) {
    className = 'crt'
    content += `
    <g transform="translate(0, 0)">
    `
  } else {
    content += `
    <g class="stagger" style="animation-delay: ${delay.toString()}ms" transform="translate(0, 0)">
    `
  }
  
  content += `
  <a xlink:href="${link}"
        target="_blank">
  <text class="${className}">${title}</text>
  </a>
         </g>
   </g>\n`

  return content

}
module.exports.svgDevtoberfestCRTLink = svgDevtoberfestCRTLink

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
async function svgBadgeItem(height, width, delay, image, title, png = false) {
  const request = require('then-request')

  let finalImage = image
  let content =
    `
   <g transform="translate(${width.toString()}, ${height.toString()})">\n`

  // @ts-ignore
  let imageData = await request('GET', image).getBody()
  let imageBase64 = Buffer.from(imageData).toString('base64')
  if (image.slice(-3) === 'png') {
    finalImage = `data:image/png;base64,${imageBase64}`
  } else {
    finalImage = `data:image/svg+xml;base64,${imageBase64}`
  }


  if (png) {
    content += `
    <g transform="translate(25, 0)">
    `
  } else {
    content += `
    <g class="stagger" style="animation-delay: ${delay.toString()}ms" transform="translate(25, 0)">
    `
  }
  content += `
       <image y="4" class="icon" href="${finalImage}" height="30" width="30"/>    
       <text class="stat bold" x="40" y="17">${title}</text>
       </g>
   </g>\n`

  return content

}
module.exports.svgBadgeItem = svgBadgeItem

/**
 * Render a Badge Showcase Item 2nd line when wrapped
 * @param {number} height 
 * @param {number} width
 * @param {number} delay - animation delay in milliseconds
 * @param {string} title 
 * @param {boolean} [png] - alter rendering for png
 * @returns {Promise<string>}
 */
async function svgBadgeItemSecond(height, width, delay, title, png = false) {
  const request = require('then-request')

  let content =
    `
   <g transform="translate(${width.toString()}, ${height.toString()})">\n`

  if (png) {
    content += `
    <g transform="translate(25, 0)">
    `

  } else {
    content += `
    <g class="stagger" style="animation-delay: ${delay.toString()}ms" transform="translate(25, 0)">
    `
  }
  content += `
       <text class="stat bold" x="40" y="17">${title}</text>
       </g>
   </g>\n`

  return content

}
module.exports.svgBadgeItemSecond = svgBadgeItemSecond


/**
 * Load Local Image as Base64
 * @param {string} image 
 * @returns {Promise<string>}
 */
async function loadImageB64(image) {

  const fs = require('fs').promises
  const path = require("path")
  return await fs.readFile(path.resolve(__dirname, image), { encoding: 'base64' })
}
module.exports.loadImageB64 = loadImageB64

/**
 * Render Error Details 
 * @param {number} height 
 * @param {number} delay - animation delay in milliseconds
 * @param {string} text 
 * @param {boolean} [png] - alter rendering for png
 * @returns {string}
 */
function svgErrorDetails(height, delay, text, png = false) {

  let content =
    `
   <g transform="translate(0, ${height.toString()})">\n`

  if (png) {
    content += `
    <g transform="translate(25, 0)">
    `
  } else {
    content += `
    <g class="stagger" style="animation-delay: ${delay.toString()}ms" transform="translate(25, 0)">
    `
  }
  content += `
       <text class="error" x="25" y="12.5">${text}:</text>
       </g>
   </g>\n`

  return content

}
module.exports.svgErrorDetails = svgErrorDetails