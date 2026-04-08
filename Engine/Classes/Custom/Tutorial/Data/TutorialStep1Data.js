const TutorialStep1Data = {
    objective: "Retirer le pare-feu sur l'ordinateur du salon",
    introNotification: "Acces WIFI desactive par le pare-feu",
    spawn: {
        x: 243,
        y: 135
    },
    bedroomExitTrigger: {
        x: 430,
        y: 110,
        width: 34,
        height: 78
    },
    bedroomInteractions: [
        {
            id: "tv_console",
            spritePath: "/Public/Assets/Game/Objects/tele.png",
            width: 35,
            height: 21,
            x: 350,
            y: 85,
            lines: [
                "Impossible d'utiliser la console ! Le pare-feu bloque tout !"
            ]
        },
        {
            id: "vr_headset",
            spritePath: "/Engine/Assets/texture_not_found.png",
            width: 20,
            height: 20,
            x: 270,
            y: 105,
            lines: [
                "J'adore voyager dans des mondes differents avec mon Casque VR 3000 !",
                "Ma mere ne sait pas que je l'ai ..."
            ]
        },
        {
            id: "pc",
            spritePath: "/Engine/Assets/texture_not_found.png",
            width: 22,
            height: 20,
            x: 297,
            y: 105,
            lines: [
                "Impossible d'utiliser le PC ! Y'a le pare-feu qui bloque tout !",
                "Ma mere ne sait pas que je l'ai ..."
            ]
        },
        {
            id: "hackemon_plush",
            spritePath: "/Engine/Assets/texture_not_found.png",
            width: 16,
            height: 16,
            x: 324,
            y: 105,
            lines: [
                "Mon premier Hackemon ! Qu'il est mignon"
            ]
        }
    ],
    livingRoomClues: [
        {
            id: "kennel",
            label: "niche",
            spritePath: "/Engine/Assets/texture_not_found.png",
            x: 486,
            y: 162,
            width: 20,
            height: 18,
            lines: [
                "Un post-it sur la niche : paperclip"
            ]
        },
        {
            id: "fridge",
            label: "frigo",
            spritePath: "/Engine/Assets/texture_not_found.png",
            x: 513,
            y: 108,
            width: 20,
            height: 24,
            lines: [
                "Sur le frigo : 1502"
            ]
        },
        {
            id: "dresser_frame",
            label: "cadre",
            spritePath: "/Engine/Assets/texture_not_found.png",
            x: 567,
            y: 135,
            width: 20,
            height: 18,
            lines: [
                "Derriere le cadre : 95"
            ]
        }
    ],
    mother: {
        spriteIdle: "/Public/Assets/Game/Characters/Maman/Maman_1.png",
        spriteAlert: "/Public/Assets/Game/Characters/Maman/Maman_2.png",
        x: 460,
        y: 120,
        width: 27,
        height: 54,
        sensingRange: 54,
        repositionOffsetX: 24
    }
};

export { TutorialStep1Data };

