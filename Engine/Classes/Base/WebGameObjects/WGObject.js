import {Coordinates_2D} from "/Engine/Classes/Base/MicroClasses/Coordinates_2D.js";
import {WGComponent}    from "/Engine/Classes/Base/Components/WGComponent.js";

class WGObject {
    #Coordinates = new Coordinates_2D();
    #Components = {};
    #Children = [];
    #Parent;

    addChild(child) {
        if (child instanceof WGObject) {
            child.parent = this;
            this.#Children.push(child);
        }
    }

    removeChild(child) {
        const index = this.#Children.indexOf(child);
        if (index > -1) {
            this.#Children.splice(index, 1);
        }
    }

    get children() {
        return this.#Children;
    }

    addComponent(component) {
        if (component instanceof WGComponent) {
            this.#Components[component.constructor.name] = component;
        }
    }

    removeComponent(component) {
        const index = this.#Components.indexOf(component);
        if (index > -1) {
            this.#Components.splice(index, 1);
        }
    }

    get components() {
        return this.#Components;
    }

    containsComponent(Component){
        return this.#Components[Component] != null;
    }

    get coordinates(){
        return this.#Coordinates;
    }

    get parent(){
        return this.#Parent;
    }

    set parent(wgObject){
        if (wgObject instanceof WGObject){
            this.#Parent = wgObject;
        }
    }

}

export {WGObject}