document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const historyDisplay = document.getElementById('history-display');
    const calc = new Calculator();

    // Angle Mode
    const btnDeg = document.getElementById('btn-deg');
    const btnRad = document.getElementById('btn-rad');

    btnDeg.addEventListener('click', () => {
        calc.angleMode = 'deg';
        btnDeg.classList.add('active');
        btnRad.classList.remove('active');
    });

    btnRad.addEventListener('click', () => {
        calc.angleMode = 'rad';
        btnRad.classList.add('active');
        btnDeg.classList.remove('active');
    });

    // Keypad Input
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            const id = btn.id;

            if (val) {
                // If the last char is a number and we add a function like 'sin(', maybe add *? 
                // For now, let's just append. User can type 2*sin(..).
                // Actually, let's just append value.
                display.value += val;
            } else if (id === 'btn-clear') {
                display.value = '';
                historyDisplay.textContent = '';
            } else if (id === 'btn-delete') {
                display.value = display.value.slice(0, -1);
            } else if (id === 'btn-equal') {
                const expression = display.value;
                if (!expression) return;

                const result = calc.evaluate(expression);
                historyDisplay.textContent = expression + ' =';
                display.value = result;
            }
        });
    });

    // Keyboard Support
    document.addEventListener('keydown', (e) => {
        const key = e.key;

        if (/[0-9.+\-*/%^()]/.test(key)) {
            display.value += key;
        } else if (key === 'Enter') {
            document.getElementById('btn-equal').click();
        } else if (key === 'Backspace') {
            display.value = display.value.slice(0, -1);
        } else if (key === 'Escape') {
            document.getElementById('btn-clear').click();
        }
    });

    // Graph Mode Toggle
    const graphToggle = document.getElementById('graph-toggle');
    const graphContainer = document.getElementById('graph-container');
    const closeGraphBtn = document.getElementById('btn-close-graph');

    graphToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            graphContainer.classList.remove('hidden');
            // Initialize graph if needed
            if (window.initGraph) window.initGraph();
        } else {
            graphContainer.classList.add('hidden');
        }
    });

    closeGraphBtn.addEventListener('click', () => {
        graphContainer.classList.add('hidden');
        graphToggle.checked = false;
    });

    // Unit Converter Logic
    const converterContainer = document.getElementById('converter-container');
    const btnOpenConverter = document.getElementById('btn-open-converter');
    const btnCloseConverter = document.getElementById('btn-close-converter');
    const categorySelect = document.getElementById('converter-category');
    const fromUnitSelect = document.getElementById('convert-from-unit');
    const toUnitSelect = document.getElementById('convert-to-unit');
    const fromValInput = document.getElementById('convert-from-val');
    const toValInput = document.getElementById('convert-to-val');

    const units = {
        length: {
            m: 1,
            cm: 0.01,
            mm: 0.001,
            km: 1000,
            in: 0.0254,
            ft: 0.3048,
            yd: 0.9144,
            mi: 1609.34
        },
        mass: {
            kg: 1,
            g: 0.001,
            mg: 0.000001,
            lb: 0.453592,
            oz: 0.0283495
        },
        temp: {
            // Special handling for temp
            C: 'C',
            F: 'F',
            K: 'K'
        },
        data: {
            B: 1,
            KB: 1024,
            MB: 1048576,
            GB: 1073741824,
            TB: 1099511627776
        }
    };

    function populateUnits(category) {
        fromUnitSelect.innerHTML = '';
        toUnitSelect.innerHTML = '';
        const unitKeys = Object.keys(units[category]);

        unitKeys.forEach(unit => {
            const option1 = document.createElement('option');
            option1.value = unit;
            option1.textContent = unit;
            fromUnitSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = unit;
            option2.textContent = unit;
            toUnitSelect.appendChild(option2);
        });

        // Set defaults
        if (unitKeys.length > 1) {
            toUnitSelect.value = unitKeys[1];
        }
        convert();
    }

    function convert() {
        const category = categorySelect.value;
        const fromUnit = fromUnitSelect.value;
        const toUnit = toUnitSelect.value;
        const val = parseFloat(fromValInput.value);

        if (isNaN(val)) {
            toValInput.value = '';
            return;
        }

        let result;

        if (category === 'temp') {
            // Temp conversion
            let valInC = val;
            if (fromUnit === 'F') valInC = (val - 32) * 5 / 9;
            if (fromUnit === 'K') valInC = val - 273.15;

            if (toUnit === 'C') result = valInC;
            if (toUnit === 'F') result = (valInC * 9 / 5) + 32;
            if (toUnit === 'K') result = valInC + 273.15;
        } else {
            // Factor based conversion
            const baseVal = val * units[category][fromUnit];
            result = baseVal / units[category][toUnit];
        }

        // Format result
        toValInput.value = parseFloat(result.toFixed(6));
    }

    btnOpenConverter.addEventListener('click', () => {
        converterContainer.classList.remove('hidden');
        populateUnits(categorySelect.value);
    });

    btnCloseConverter.addEventListener('click', () => {
        converterContainer.classList.add('hidden');
    });

    categorySelect.addEventListener('change', () => {
        populateUnits(categorySelect.value);
    });

    fromValInput.addEventListener('input', convert);
    fromUnitSelect.addEventListener('change', convert);
    toUnitSelect.addEventListener('change', convert);
});
