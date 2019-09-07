#!/usr/bin/env node

'use strict';

const cmd = require('node-cmd');
const readline = require('readline');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');
const figlet = require('figlet');

let spinner;


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(questionText, defaultValue) {
    return new Promise((resolve) => {
        rl.question(`${chalk.hex('#98c379').bold('❯ ')} ${questionText}: `, (answer) => {
            resolve(answer || defaultValue);
        })
    })
}

function createAngularWorkspace(options) {
    logSteps(`Creating Angular Workspace`);
    cmd.get(
        `
    ng new ${options.libName} --create-application=false
    `,
        () => generateAngularLibrary(options)
    );
}

function generateAngularLibrary(options) {
    logSteps(`Creating Angular Library`);
    cmd.get(
        `
        cd ${options.libName} 
        ng generate library ${options.libName} --prefix=${options.libPrefix}`,
        () => generateAngularApplicationExample(options)
    );
}

function generateAngularApplicationExample(options) {
    logSteps(`Creating Angular application example`);
    cmd.get(
        `
        cd ${options.libName}
        ng generate application ${options.libName}-example --style=${options.exampleStyle}
        ng config schematics.@schematics/angular:component.styleext ${options.exampleStyle}
        `,
        () => installAdditionalNpmPackages(options)
    );
}

function installAdditionalNpmPackages(options) {
    logSteps(`Installing additional npm packages:  prettier, tslint-config-prettier, husky, lint-staged`);
    cmd.get(
        `
        cd ${options.libName}
        npm i --D --E prettier
        npm i --D tslint-config-prettier husky lint-staged     
        `,
        () => {
            createLicenseFile(options);
            copyPrettierFile(options);
            console.log(chalk.hex('#1ec537').bold(`\n\r Library ${options.libName} created successfully. 💪`));
            figlet(options.libName, function(err, data) {
                if (err) {
                    console.log('Something went wrong...');
                    console.dir(err);
                    return;
                }
                console.log(data)
            });

            editJsonFile(`./${options.libName}/package.json`, (jsonObject) => {
                const libName = options.libName;
                jsonObject.scripts = {
                    "ng": "ng",
                    "all:build": "npm run example:build && npm run lib:build",
                    "example:start": "ng serve --open",
                    "example:build": `ng build ${libName}-example --prod --aot --buildOptimizer`,
                    "example:publish-2-gh-pages": `npm run example:build && ngh --dir=./dist/${libName}-example --no-silent`,
                    "example:lint": `ng lint ${libName}-example --fix`,
                    "lib:build": `ng build ${libName}`,
                    "lib:lint": `ng lint ${libName} --fix`,
                    "lib:publish-2-npm": `./dist/${libName} npm publish`
                };

                jsonObject.husky = {hooks: {"pre-commit": "lint-staged"}};
                jsonObject["lint-staged"] = {
                    "projects/**/*.ts": [
                        "prettier --write",
                        "git add"
                    ]
                };
                return jsonObject;
            });

            editJsonFile(`./${options.libName}/tslint.json`, (jsonObject) => {
                if (Array.isArray(jsonObject.extends)) {
                    jsonObject.extends = [...jsonObject.extends];
                } else {
                    jsonObject.extends = [jsonObject.extends];
                }
                jsonObject.extends.push("tslint-config-prettier");

                return jsonObject;
            });
        }
    );
}

function createLicenseFile(options) {
    const fullName = options.fullName.toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');

    const data = fs.readFileSync(`${__dirname}/template-files/LICENSE`, 'utf-8');
    let newValue = data.replace('[year]', new Date().getFullYear());
    newValue = newValue.replace('[fullname]', fullName);
    fs.writeFileSync(`./${options.libName}/LICENSE`, newValue, 'utf-8');
    logSteps('Adding LICENSE file.');
}

function copyPrettierFile(options) {
    const data = fs.readFileSync(`${__dirname}/template-files/.prettierrc`, 'utf-8');
    fs.writeFileSync(`./${options.libName}/.prettierrc`, data, 'utf-8');
    logSteps('Adding .prettierrc file.');
    spinner.succeed();
}

function editJsonFile(pathToFile, cb) {
    let jsonObject = JSON.parse(fs.readFileSync(pathToFile, 'utf8'));
    jsonObject = cb(jsonObject);
    fs.writeFileSync(pathToFile, JSON.stringify(jsonObject, null, 2));
}

function logBlue(text) {
    console.log(chalk.hex("#61AFEF").bold(text));
}

function logYellow(text) {
    console.log(chalk.hex("#FCE546").bold(text));
}

function logSteps(text) {
    if (spinner) {
        spinner.succeed();
    }
    spinner = ora(`${chalk.hex('#98c379')(text)}`).start();
}

async function questions(){
    const options = {};
    options.libName = await question('Enter library name');
    options.fullName = await question('Enter your full name');
    options.libPrefix = await question('Enter library prefix', 'ngx');
    options.exampleStyle = await question('Enter style: (css|scss|sass|less|styl)', 'scss');
    rl.close();
    return options;
}

const main = async () => {
    logBlue('Hi, welcome to Angular Library Generator 🚀 \n\r');
    const options = await questions();
    logYellow('\n\r Start generating your library. (it might take some time)');
    createAngularWorkspace(options);
};

main();
