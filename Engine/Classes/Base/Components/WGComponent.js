class WGComponent {
    #Enabled = true;

    get enabled(){
        return this.#Enabled
    }

    set enabled(bool){
        this.#Enabled = bool
        return this;
    }
}

export {WGComponent}