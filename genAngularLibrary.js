#!/usr/bin/env node

'use strict';

const cmd = require('node-cmd');
const readline = require('readline');
const fs = require('fs');
const chalk = require('chalk');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(questionText) {
    return new Promise((resolve) => {
        rl.question(`${chalk.hex('#98c379').bold('❯ ')} ${questionText}: `, (answer) => {
            resolve(answer);
        })
    })
}

function createAngularLibrary(libName, fullName) {
    createAngularWorkspace(libName, fullName);
}

function createAngularWorkspace(libName, fullName) {
    logSteps(`- Creating Angular Workspace`);
    cmd.get(
        `
    ng new ${libName} --create-application=false
    `,
        () => generateAngularLibrary(libName, fullName)
    );
}

function generateAngularLibrary(libName, fullName) {
    logSteps(`- Creating Angular Library`);
    cmd.get(
        `
        cd ${libName} 
        ng generate library ${libName}`,
        () => generateAngularApplicationExample(libName, fullName)
    );
}

function generateAngularApplicationExample(libName, fullName) {
    logSteps(`- Creating Angular application example`);
    cmd.get(
        `
        cd ${libName}
        ng generate application ${libName}-example --style=scss`,
        () => installAdditionalNpmPackages(libName, fullName)
    );
}

function installAdditionalNpmPackages(libName, fullName) {
    logSteps(`- Install additional npm packages: prettier, tslint-config-prettier`);
    cmd.get(
        `
        cd ${libName}
        npm i --D --E prettier
        npm i --D tslint-config-prettier
        `,
        () => {
            createLicenseFile(libName, fullName);
            copyPrettierFile(libName);
            console.log(chalk.hex('#1ec537').bold(`\n\r Library ${libName} created successfully.`));
        }
    );
}

function copyPrettierFile(libName) {
    const data = fs.readFileSync(`${__dirname}/template-files/.prettierrc`, 'utf-8');
    fs.writeFileSync(`./${libName}/.prettierrc`, data, 'utf-8');
    logSteps('- adding .prettierrc file.');
}

function createLicenseFile(libName, fullName) {
    fullName = fullName.toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');

    const data = fs.readFileSync(`${__dirname}/template-files/LICENSE`, 'utf-8');
    let newValue = data.replace('[year]', new Date().getFullYear());
    newValue = newValue.replace('[fullname]', fullName);
    fs.writeFileSync(`./${libName}/LICENSE`, newValue, 'utf-8');
    logSteps('- adding LICENSE file.');
}

function logBlue(text) {
    console.log(chalk.hex("#61AFEF").bold(text));
}

function logYellow(text) {
    console.log(chalk.hex("#FCE546").bold(text));
}

function logSteps(text) {
    console.log(chalk.yellow(text));
}

const main = async () => {
    logBlue('Hi, welcome to Angular Library Generator \n\r');
    const libName = await question('Enter library name');
    const fullName = await question('Enter your full name');
    rl.close();
    logYellow('\n\r Start generating your library. (it might take some time)');
    createAngularLibrary(libName, fullName);
};

main();
