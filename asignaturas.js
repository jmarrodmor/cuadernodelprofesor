// ==========================================
// CATÁLOGO DE ASIGNATURAS Y CURRÍCULOS LOMLOE
// ==========================================

const CATALOGO_ASIGNATURAS = {
  "tecnologia": {
    id: "tecnologia",
    nombreMateria: "Tecnología (4º ESO)",

    DESCRIPCIONES_COMPETENCIAS: {
      "1": "1. Identificar y proponer problemas tecnológicos con iniciativa y creatividad, estudiando las necesidades de su entorno próximo y aplicando estrategias y procesos colaborativos e iterativos relativos a proyectos, para idear y planificar soluciones de manera eficiente, accesible, sostenible e innovadora.",
      "2": "2. Aplicar de forma apropiada y segura distintas técnicas y conocimientos interdisciplinares, utilizando procedimientos y recursos tecnológicos y analizando el ciclo de vida de productos, para fabricar soluciones tecnológicas accesibles y sostenibles que den respuesta a necesidades planteadas.",
      "3": "3. Expresar, comunicar y difundir ideas, propuestas o soluciones tecnológicas en diferentes foros de manera efectiva, usando un lenguaje inclusivo y no sexista, empleando los recursos disponibles y aplicando los elementos y las técnicas necesarias, para intercambiar la información de manera responsable y fomentar el trabajo en equipo.",
      "4": "4. Desarrollar soluciones automatizadas a problemas planteados, aplicando los conocimientos necesarios e incorporando tecnologías emergentes, para diseñar y construir sistemas de control programables y robóticos.",
      "5": "5. Aprovechar y emplear de manera responsable las posibilidades de las herramientas digitales, adaptándolas a sus necesidades, configurándolas y aplicando conocimientos interdisciplinares, para la resolución de tareas de una manera más eficiente.",
      "6": "6. Analizar procesos tecnológicos, teniendo en cuenta su impacto en la sociedad y el entorno y aplicando criterios de sostenibilidad y accesibilidad, para hacer un uso ético y ecosocialmente responsable de la tecnología."
    },

    DESCRIPCIONES_CRITERIOS: {
      "1.1": "1.1. Idear y planificar soluciones tecnológicas emprendedoras que generen un valor para la comunidad a partir de la observación y el análisis del entorno más cercano, estudiando sus necesidades, requisitos y posibilidades de mejora.",
      "1.2": "1.2. Aplicar con iniciativa estrategias colaborativas de gestión de proyectos con una perspectiva interdisciplinar y siguiendo un proceso iterativo de validación, desde la fase de ideación hasta la difusión de la solución.",
      "1.3": "1.3. Abordar la gestión del proyecto de forma creativa, aplicando estrategias y técnicas colaborativas adecuadas, así como métodos de investigación en la ideación de soluciones lo más eficientes, accesibles e innovadoras posibles.",
      "2.1": "2.1. Analizar el diseño de un producto que dé respuesta a una necesidad planteada, evaluando su demanda, evolución y previsión de fin de ciclo de vida con un criterio ético, responsable e inclusivo.",
      "2.2": "2.2. Fabricar productos y soluciones tecnológicas, aplicando herramientas de diseño asistido, técnicas de elaboración manual, mecánica y digital y utilizando los materiales y recursos mecánicos, eléctricos, electrónicos y digitales adecuados.",
      "3.1": "3.1. Intercambiar información y fomentar el trabajo en equipo de manera asertiva, empleando las herramientas digitales adecuadas junto con el vocabulario técnico, símbolos y esquemas de sistemas tecnológicos apropiados.",
      "3.2": "3.2. Presentar y difundir las propuestas o soluciones tecnológicas de manera efectiva, empleando la entonación, expresión, gestión del tiempo y adaptación adecuada del discurso, así como un lenguaje inclusivo y no sexista.",
      "4.1": "4.1. Diseñar, construir, controlar o simular sistemas automáticos programables y robots que sean capaces de realizar tareas de forma autónoma, aplicando conocimientos de mecánica, electrónica, neumática y componentes de los sistemas de control, así como otros conocimientos interdisciplinares.",
      "4.2": "4.2. Integrar en las máquinas y sistemas tecnológicos aplicaciones informáticas y tecnologías digitales emergentes de control y simulación como el internet de las cosas, el big data y la inteligencia artificial con sentido crítico y ético.",
      "5.1": "5.1. Resolver tareas propuestas de manera eficiente, mediante el uso y configuración de diferentes aplicaciones y herramientas digitales, aplicando conocimientos interdisciplinares con autonomía.",
      "6.1": "6.1. Hacer un uso responsable de la tecnología, mediante el análisis y aplicación de criterios de sostenibilidad y accesibilidad en la selección de materiales y en el diseño de estos, así como en los procesos de fabricación de productos tecnológicos, minimizando el impacto negativo en la sociedad y en el planeta.",
      "6.2": "6.2. Analizar los beneficios que, en el cuidado del entorno, aportan la arquitectura bioclimática y el ecotransporte, valorando la contribución de las tecnologías al desarrollo sostenible.",
      "6.3": "6.3. Identificar y valorar la repercusión y los beneficios del desarrollo de proyectos tecnológicos de carácter social por medio de comunidades abiertas, acciones de voluntariado o proyectos de servicio a la comunidad."
    },

    DESCRIPCIONES_DESCRIPTORES: {
      "CCL1": "Competencia lingüística: Expresa hechos y opiniones de forma oral y escrita.",
      "CP2": "Competencia plurilingüe: Interactúa en otras lenguas en situaciones cotidianas.",
      "STEM1": "STEM: Utiliza métodos deductivos e inductivos propios de las ciencias.",
      "STEM2": "STEM: Utiliza el pensamiento científico para plantear hipótesis y resolver problemas.",
      "STEM3": "STEM: Plantea y resuelve problemas analizando críticamente los resultados.",
      "STEM4": "STEM: Interpreta y transmite información con lenguaje científico y técnico.",
      "STEM5": "STEM: Emprende acciones para preservar el medio ambiente y la salud.",
      "CD1": "Competencia digital: Realiza búsquedas avanzadas e interacciona en entornos virtuales.",
      "CD2": "Competencia digital: Crea y modifica contenidos digitales en diversos formatos.",
      "CD3": "Competencia digital: Participa en actividades cooperativas con herramientas digitales.",
      "CD4": "Competencia digital: Protege la identidad digital, datos y privacidad.",
      "CD5": "Competencia digital: Desarrolla soluciones algorítmicas mediante programación.",
      "CPSAA3": "Personal, social y aprender a aprender: Evalúa sus propios aprendizajes y procesos.",
      "CPSAA4": "Personal, social y aprender a aprender: Favorece la convivencia democrática e inclusiva.",
      "CPSAA5": "Personal, social y aprender a aprender: Mantiene una actitud resiliente y de superación.",
      "CC4": "Competencia ciudadana: Analiza el impacto ecológico y promueve el desarrollo sostenible.",
      "CE1": "Competencia emprendedora: Diseña y gestiona ideas originales generando valor.",
      "CE3": "Competencia emprendedora: Desarrolla proyectos de forma cooperativa liderando tareas.",
      "CCEC3": "Conciencia cultural: Expresa ideas e impresiones utilizando diversos soportes artísticos.",
      "CCEC4": "Conciencia cultural: Diseña productos culturales teniendo en cuenta la estética."
    },

    DESCRIPCIONES_COMPETENCIAS_CLAVE: {
      "CCL": "Competencia en Comunicación Lingüística: Comprender y expresar pensamientos, emociones y conceptos de forma oral y escrita.",
      "CP": "Competencia Plurilingüe: Utilizar distintas lenguas de forma eficaz para el aprendizaje y la comunicación.",
      "STEM": "Competencia Matemática y en Ciencia, Tecnología e Ingeniería (STEM): Comprender el mundo utilizando modelos y métodos científicos.",
      "CD": "Competencia Digital: Uso seguro, crítico y responsable de las tecnologías digitales para el aprendizaje y la sociedad.",
      "CPSAA": "Competencia Personal, Social y de Aprender a Aprender: Reflexionar sobre uno mismo, gestionar el tiempo y trabajar colaborativamente.",
      "CC": "Competencia Ciudadana: Actuar como ciudadanos responsables y participar plenamente en la vida social y cívica.",
      "CE": "Competencia Emprendedora: Desarrollar la creatividad y capacidad de transformar ideas en actos que generen valor.",
      "CCEC": "Competencia en Conciencia y Expresión Culturales: Comprender y respetar cómo las ideas son expresadas en distintas culturas."
    },

    CONFIG_COMPETENCIAS_CLAVE: {
      "CCL":   { nombre: "CCL - Comunicación Lingüística", colorClass: "comp-ccl" },
      "CP":    { nombre: "CP - Plurilingüe", colorClass: "comp-cp" },
      "STEM":  { nombre: "STEM - Ciencia, Tec. y Mates", colorClass: "comp-stem" },
      "CD":    { nombre: "CD - Digital", colorClass: "comp-cd" },
      "CPSAA": { nombre: "CPSAA - Aprender a Aprender", colorClass: "comp-cpsaa" },
      "CC":    { nombre: "CC - Ciudadana", colorClass: "comp-cc" },
      "CE":    { nombre: "CE - Emprendedora", colorClass: "comp-ce" },
      "CCEC":  { nombre: "CCEC - Expresión Cultural", colorClass: "comp-ccec" }
    },

    MAPA_CURRICULAR: [
      { compNum: "1", compNombre: "1. Identificar y proponer...", descriptores: ["STEM1", "STEM2", "CD1", "CD3", "CPSAA3", "CPSAA4", "CE1", "CE3"], criterios: ["1.1", "1.2", "1.3"] },
      { compNum: "2", compNombre: "2. Aplicar de forma...", descriptores: ["STEM2", "STEM5", "CD2", "CPSAA4", "CC4", "CCEC4"], criterios: ["2.1", "2.2"] },
      { compNum: "3", compNombre: "3. Expresar, comunicar...", descriptores: ["CCL1", "STEM4", "CD3", "CPSAA3", "CCEC3"], criterios: ["3.1", "3.2"] },
      { compNum: "4", compNombre: "4. Desarrollar soluciones...", descriptores: ["CP2", "STEM1", "STEM3", "CD5", "CPSAA5", "CE3"], criterios: ["4.1", "4.2"] },
      { compNum: "5", compNombre: "5. Aprovechar y emplear...", descriptores: ["CP2", "CD2", "CD5", "CPSAA4", "CPSAA5"], criterios: ["5.1"] },
      { compNum: "6", compNombre: "6. Analizar procesos...", descriptores: ["STEM2", "STEM5", "CD4", "CC4"], criterios: ["6.1", "6.2", "6.3"] }
    ]
  },

  "tecnologia_digitalizacion": {
    id: "tecnologia_digitalizacion",
    nombreMateria: "Tecnología y digitalización (1º y 2º ESO)",

    DESCRIPCIONES_COMPETENCIAS: {
      "1": "1. Buscar, seleccionar y organizar información en entornos digitales con actitud crítica y segura.",
      "2": "2. Abordar problemas mediante el diseño y construcción de soluciones tecnológicas sostenibles.",
      "3": "3. Utilizar herramientas informáticas y de diseño para la creación de contenido digital.",
      "4": "4. Representar e comunicar ideas técnicas utilizando simbología y normalización adecuada.",
      "5": "5. Desarrollar un proyecto técnico trabajando de forma cooperativa e inclusiva.",
      "6": "6. Comprender el funcionamiento de los sistemas tecnológicos y su impacto en la sociedad.",
      "7": "7. Hacer uso responsable de los recursos tecnológicos promoviendo el desarrollo sostenible."
    },

    DESCRIPCIONES_CRITERIOS: {
      "1.1": "1.1. Buscar y seleccionar información relevante en la red con sentido crítico.",
      "1.2": "1.2. Organizar y almacenar la información digital de forma segura.",
      "1.3": "1.3. Aplicar medidas básicas de seguridad y protección de datos.",
      "2.1": "2.1. Diseñar soluciones tecnológicas creativas a problemas planteados.",
      "2.2": "2.2. Construir prototipos aplicando normas de seguridad e higiene.",
      "3.1": "3.1. Elaborar documentos y presentaciones utilizando aplicaciones informáticas.",
      "4.1": "4.1. Interpretar y realizar bocetos y croquis técnicos utilizando acotación.",
      "5.1": "5.1. Trabajar en equipo repartiendo tareas con empatía y equidad.",
      "5.2": "5.2. Planificar las fases de un proyecto técnico respetando tiempos.",
      "5.3": "5.3. Evaluar el proceso de trabajo en grupo proponiendo mejoras.",
      "6.1": "6.1. Identificar los componentes principales de un sistema informático o tecnológico.",
      "6.2": "6.2. Analizar las repercusiones del avance tecnológico en el entorno social y ambiental.",
      "6.3": "6.3. Valorar la importancia de la ciberseguridad y la identidad digital.",
      "7.1": "7.1. Evaluar el consumo energético e impacto medioambiental de la tecnología.",
      "7.2": "7.2. Aplicar criterios de economía circular en la reutilización de materiales."
    },

    DESCRIPCIONES_DESCRIPTORES: {
      "CCL1": "Competencia lingüística: Expresa hechos y opiniones de forma oral y escrita.",
      "CCL3": "Competencia lingüística: Localiza, selecciona y contrasta información de diversas fuentes.",
      "CP2": "Competencia plurilingüe: Interactúa en otras lenguas en situaciones cotidianas.",
      "STEM1": "STEM: Utiliza métodos deductivos e inductivos propios de las ciencias.",
      "STEM2": "STEM: Utiliza el pensamiento científico para plantear hipótesis y resolver problemas.",
      "STEM3": "STEM: Plantea y resuelve problemas analizando críticamente los resultados.",
      "STEM4": "STEM: Interpreta y transmite información con lenguaje científico y técnico.",
      "STEM5": "STEM: Emprende acciones para preservar el medio ambiente y la salud.",
      "CD1": "Competencia digital: Realiza búsquedas avanzadas e interacciona en entornos virtuales.",
      "CD2": "Competencia digital: Crea y modifica contenidos digitales en diversos formatos.",
      "CD3": "Competencia digital: Participa en actividades cooperativas con herramientas digitales.",
      "CD4": "Competencia digital: Protege la identidad digital, datos y privacidad.",
      "CD5": "Competencia digital: Desarrolla soluciones algorítmicas mediante programación.",
      "CPSAA1": "Personal, social y aprender a aprender: Reflexiona sobre sí mismo y sus metas.",
      "CPSAA3": "Personal, social y aprender a aprender: Evalúa sus propios aprendizajes y procesos.",
      "CPSAA4": "Personal, social y aprender a aprender: Favorece la convivencia democrática e inclusiva.",
      "CPSAA5": "Personal, social y aprender a aprender: Mantiene una actitud resiliente y de superación.",
      "CC4": "Competencia ciudadana: Analiza el impacto ecológico y promueve el desarrollo sostenible.",
      "CE1": "Competencia emprendedora: Diseña y gestiona ideas originales generando valor.",
      "CE3": "Competencia emprendedora: Desarrolla proyectos de forma cooperativa liderando tareas.",
      "CCEC3": "Conciencia cultural: Expresa ideas e impresiones utilizando diversos soportes artísticos.",
      "CCEC4": "Conciencia cultural: Diseña productos culturales teniendo en cuenta la estética."
    },

    DESCRIPCIONES_COMPETENCIAS_CLAVE: {
      "CCL": "Competencia en Comunicación Lingüística: Comprender y expresar pensamientos, emociones y conceptos de forma oral y escrita.",
      "CP": "Competencia Plurilingüe: Utilizar distintas lenguas de forma eficaz para el aprendizaje y la comunicación.",
      "STEM": "Competencia Matemática y en Ciencia, Tecnología e Ingeniería (STEM): Comprender el mundo utilizando modelos y métodos científicos.",
      "CD": "Competencia Digital: Uso seguro, crítico y responsable de las tecnologías digitales para el aprendizaje y la sociedad.",
      "CPSAA": "Competencia Personal, Social y de Aprender a Aprender: Reflexionar sobre uno mismo, gestionar el tiempo y trabajar colaborativamente.",
      "CC": "Competencia Ciudadana: Actuar como ciudadanos responsables y participar plenamente en la vida social y cívica.",
      "CE": "Competencia Emprendedora: Desarrollar la creatividad y capacidad de transformar ideas en actos que generen valor.",
      "CCEC": "Competencia en Conciencia y Expresión Culturales: Comprender y respetar cómo las ideas son expresadas en distintas culturas."
    },

    CONFIG_COMPETENCIAS_CLAVE: {
      "CCL":   { nombre: "CCL - Comunicación Lingüística", colorClass: "comp-ccl" },
      "CP":    { nombre: "CP - Plurilingüe", colorClass: "comp-cp" },
      "STEM":  { nombre: "STEM - Ciencia, Tec. y Mates", colorClass: "comp-stem" },
      "CD":    { nombre: "CD - Digital", colorClass: "comp-cd" },
      "CPSAA": { nombre: "CPSAA - Aprender a Aprender", colorClass: "comp-cpsaa" },
      "CC":    { nombre: "CC - Ciudadana", colorClass: "comp-cc" },
      "CE":    { nombre: "CE - Emprendedora", colorClass: "comp-ce" },
      "CCEC":  { nombre: "CCEC - Expresión Cultural", colorClass: "comp-ccec" }
    },

    MAPA_CURRICULAR: [
      { compNum: "1", compNombre: "1. Buscar...", descriptores: ["CCL3", "STEM2", "CD1", "CD4", "CPSAA4", "CE1"], criterios: ["1.1", "1.2", "1.3"] },
      { compNum: "2", compNombre: "2. Abordar...", descriptores: ["CCL1", "STEM1", "STEM3", "CD3", "CPSAA3", "CPSAA5", "CE1", "CE3"], criterios: ["2.1", "2.2"] },
      { compNum: "3", compNombre: "3. Utilizar...", descriptores: ["STEM2", "STEM3", "STEM5", "CD5", "CPSAA1", "CE3", "CCEC3"], criterios: ["3.1"] },
      { compNum: "4", compNombre: "4. Representar...", descriptores: ["CCL1", "STEM4", "CD3", "CCEC3", "CCEC4"], criterios: ["4.1"] },
      { compNum: "5", compNombre: "5. Desarrollar...", descriptores: ["CP2", "STEM1", "STEM3", "CD5", "CPSAA5", "CE3"], criterios: ["5.1", "5.2", "5.3"] },
      { compNum: "6", compNombre: "6. Comprender...", descriptores: ["CP2", "CD2", "CD4", "CD5", "CPSAA4", "CPSAA5"], criterios: ["6.1", "6.2", "6.3"] },
      { compNum: "7", compNombre: "7. Hacer uso...", descriptores: ["STEM2", "STEM5", "CD4", "CC4"], criterios: ["7.1", "7.2"] }
    ]
  }
};