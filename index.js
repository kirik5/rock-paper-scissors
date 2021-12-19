const readline = require('readline')
const {stdin: input, stdout: output} = require('process')
const srs = require('secure-random-string')
const CryptoJS = require('crypto-js')

class SecretKey {
    constructor(length) {
        this._length = length
    }

    generate() {
        return srs({length: this._length})
    }
}

class Hmac {
    generate(message, key) {
        return CryptoJS.HmacSHA3(message, key).toString()
    }
}

class Winner {
    constructor(moves) {
        this._movesCount = moves.length
    }

    who(userMove, computerMove) {
        if (userMove == computerMove) return 'DRAW!!!'

        const winComputerMoves = new Set

        let winComputerMove = userMove + 1
        for (let i = 1; i <= Math.floor(this._movesCount / 2); i++) {
            if (winComputerMove > this._movesCount) {
                winComputerMove = 1
            }
            winComputerMoves.add(winComputerMove)
            winComputerMove += 1
        }

        if (winComputerMoves.has(computerMove)) return 'Computer WIN!!!'
        return 'You WIN!!!'
    }
}

class WinLoseTable {
    constructor(moves) {
        this._moves = moves
        this._length = moves.length
    }

    print() {
        console.log('')
        let header = 'comp|user'.padStart(10)
        for (let move of this._moves) {
            header = header + move.padStart(10)
        }
        console.log(header)

        for (let i = 1; i <= this._length; i++) {
            let row = this._moves[i - 1].padStart(10)
            for (let j = 1; j <= this._length; j++) {
                let cell = ''

                if (i === j) {
                    cell = 'Draw'
                } else if (((j - i) <= Math.floor(this._length / 2)) && (j > i)) {
                    cell = 'Win'
                } else if (i - j > Math.floor(this._length / 2)) {
                    cell = 'Win'
                } else {
                    cell = 'Lose'
                }

                row = row + cell.padStart(10)
            }
            console.log(row)
        }
        console.log('')
    }
}


const parameters = process.argv.slice(2)
const secretKey = new SecretKey(256)
const hmac = new Hmac
const winner = new Winner(parameters)
const winnerLoseTable = new WinLoseTable(parameters)
const key = secretKey.generate()
startGame(parameters, key)

function startGame(parameters, key) {
    if (!isCorrectArguments(parameters)) return

    playGame(parameters, key)
}

function isCorrectArguments(arguments) {
    const errors = {
        moreArguments: 'Enter at least 3 arguments !!! (For example "rock paper scissors")',
        duplicateArguments: 'Enter unique arguments!!! (For example "rock paper scissors lizard Spock")',
        evenParametersCount: 'Enter odd count of parameters!!! (3, 5, 7, ...)'
    }

    if (arguments.length < 3) {
        console.log(errors.moreArguments)
        return false
    }
    if (arguments.length % 2 === 0) {
        console.log(errors.evenParametersCount)
        return false
    }
    if (!isUniqueArguments(arguments)) {
        console.log(errors.duplicateArguments)
        return false
    }
    return true
}

function isUniqueArguments(arguments) {
    const uniqueArguments = new Set()

    arguments.forEach(element => {
        uniqueArguments.add(element)
    })
    return uniqueArguments.size === arguments.length
}

function playGame(arguments, key) {
    const computerMove = getComputerMove(arguments)
    const computerMoveHmac = hmac.generate(arguments[parseInt(computerMove) - 1], key)

    console.log('')
    console.log('HMAC: ', computerMoveHmac)
    console.log('')

    printGameMenu(arguments)
    nextMove(arguments, computerMove, key)
}

function getComputerMove(arguments) {
    return Math.floor(Math.random() * arguments.length) + 1
}

function printGameMenu(arguments) {
    console.log('Available moves:')

    arguments.forEach((argument, index) => console.log(`${index + 1} - ${argument}`))

    console.log(`0 - exit`)
    console.log(`? - help`)
}

function nextMove(arguments, computerMove, key) {
    const read = readline.createInterface({input, output});

    console.log('')

    read.question('Enter your move: ', answer => {
        read.close()

        if (answer > arguments.length) {
            console.log('')
            console.log(`Incorrect move... Enter new correct move! (from 0 to ${arguments.length})`)
            console.log('')

            printGameMenu(arguments)
            nextMove(arguments, computerMove, key)
            return
        }
        if (answer === '0') {
            console.log('')
            console.log('Bye...')
            return
        }
        if (answer === '?') {
            winnerLoseTable.print()
            printGameMenu(arguments)
            nextMove(arguments, computerMove, key)
            return
        }
        console.log(`Your move: ${arguments[parseInt(answer) - 1]}`)
        console.log(`Computer move: ${arguments[computerMove - 1]}`)
        console.log(winner.who(parseInt(answer), computerMove))

        console.log()
        console.log(`HMAC key: ${key}`)
        console.log(`------------------------------`)

        playGame(arguments, key)
    })
}