const fs = require('fs')
const path = require("node:path");
const EngineFolder = path.join(require.main.path,"../Engine/")

const ProjectName = "Hackengine"

function loadDependenciesFromFolder(path,originalPath = path,array=[]){
    try {
        const files = fs.readdirSync(path);
        for (let i = 0; i < files.length; i++) {
            if (fs.lstatSync(path+files[i]).isDirectory()){
                array = array.concat(loadDependenciesFromFolder(path+files[i]+"\\",path))
            }else if (files[i].endsWith(".js")){
                array.push(originalPath.split(ProjectName)[1]+path.split(originalPath)[1]+files[i])
            }
        }
        return array
    } catch (err) {
        console.error('Error reading directory:', err);
    }
}

function getDependencies(){
    return loadDependenciesFromFolder(EngineFolder)
}

module.exports = {
    getDependencies,
}