class MegaTicks {
    static clients = {}

    static newTickRegister(Client, ID) {
        if (MegaTicks.clients[Client] == null) {
            MegaTicks.clients[Client] = {}
        }
        MegaTicks.clients[Client][ID] = 0;
    }

    static getTicksRegister(Client, ID) {
        if (MegaTicks.clients[Client] == null) {
            throw new Error("You must first register the client to use MegaTicks on this object.")
        }
        if (MegaTicks.clients[Client][ID] == null) {
            throw new Error("Invalid ID...")
        }
        return MegaTicks.clients[Client][ID];
    }

    static cleanTicksRegister(Client, ID) {
        if (MegaTicks.clients[Client] == null) {
            throw new Error("You must first register the client to use MegaTicks on this object.")
        }
        if (MegaTicks.clients[Client][ID] == null) {
            throw new Error("Invalid ID...")
        }
        MegaTicks.clients[Client][ID] = 0;
    }

    static updateTicks(DeltaTime) {
        for (const client in MegaTicks.clients) {
            for (const id in MegaTicks.clients[client]) {
                MegaTicks.clients[client][id] += 1;
            }
        }
    }
}

export { MegaTicks }
