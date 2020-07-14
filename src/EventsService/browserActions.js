import { consoleLog } from "../utils/debuggingFuncs"
import handleRuntimeError from "../utils/handleRuntimeError"
import { parseJoyStickSpeed } from "../gamepads/joyStickUtils"
import runScript from "../utils/runScript"

const defaultParams = [
    null,
    handleRuntimeError
]

export const newTab = () => {
    chrome.tabs.create()
}

export const closeTab = () => {
    chrome.tabs.remove()
}

export const historyBack = () => {
    chrome.tabs.goBack(...defaultParams)
}

export const historyForward = () => {
    chrome.tabs.goForward(...defaultParams)
}

export const tabLeft = () => {
    chrome.tabs.query({}, tabs=>{
        if (tabs.length === 1) return
        const activeTab = tabs.findIndex(tab=>tab.active === true)

        let tabToLeftOfActive = (
            activeTab === 0
                ? tabs.length - 1
                : activeTab - 1
        )

        chrome.tabs.highlight({tabs: tabToLeftOfActive}, handleRuntimeError)
    })
}

export const tabRight = () => {
    chrome.tabs.query({}, tabs=>{
        if (tabs.length === 1) return
        const activeTab = tabs.findIndex(tab=>tab.active === true)

        let tabToRightOfActive = (
            activeTab === (tabs.length - 1)
                ? 0
                : activeTab + 1
        )

        chrome.tabs.highlight({tabs: tabToRightOfActive}, handleRuntimeError)
    })
}

// ? x & y shapes: { coord: number, directionActive: boolean }
export const scroll = (x, y) => {
    const {top, left} = parseJoyStickSpeed(x, y)
    const code = `scrollBy({
        top: ${top},
        left: ${left},
        behavior: 'smooth'
    })`
    chrome.tabs.executeScript(null, { code }, handleRuntimeError);
}

export const moveCursor = (x, y) => {
    runScript(`
        document.querySelector('#cursor').style.left = "300px"
    `)
}