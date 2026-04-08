const TutorialStep1Data = {
    objective: "Retirer le pare-feu sur l'ordinateur du salon",
    step2Objective: "S'infiltrer dans le salon sans se faire reperer",
    introNotification: "Acces WIFI desactive par le pare-feu",
    failText: "Mais tu dors pas ?!!! RETOURNE DANS TA CHAMBRE DE SUITE",
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
            ],
            linesAfterFirewall: [
                "Pare-feu desactive !",
                "Yes ! Je peux rejouer a la console."
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
                "Clipper dort dans sa niche"
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
                "Un calendrier est colle sur le frigo"
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
                "Une photo encadree de maman est posee"
            ]
        }
    ],
    infiltrationPath: [
        { id: "corridor_start", x: 432, y: 108, width: 54, height: 30 },
        { id: "wall_lane_1", x: 486, y: 108, width: 54, height: 30 },
        { id: "wall_lane_2", x: 540, y: 108, width: 54, height: 30 },
        { id: "behind_mother", x: 486, y: 135, width: 108, height: 30 },
        { id: "pc_access", x: 567, y: 162, width: 54, height: 30 }
    ],
    clueCompletionText: {
        kennel: "Complete clipper _ _ _ _",
        frame: "Complete _ _ _ _ _ _ _ _ _ 95",
        fridge: "Complete _ _ _ _ _ _ _ 1502 _ _"
    },
    passwordTarget: "clipper150295",
    mother: {
        spriteIdle: "/Public/Assets/Game/Characters/Maman/Maman_1.png",
        spriteAlert: "/Public/Assets/Game/Characters/Maman/Maman_2.png",
        x: 460,
        y: 120,
        width: 27,
        height: 54,
        sensingRange: 54
    }
};

export { TutorialStep1Data };

