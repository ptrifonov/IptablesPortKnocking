//Основен обект, в който се съхраняват входните данни подадени от потребителя и в член-променливата script се пази скрипта
const mainObj = {
	portsToSecure: [],
	patternRules: [],
	timeoout: 30,
	timeoutBetweenPackets: 10,
	script: "",
};

//Масив, който се използва за рендериране на отделните правила по красив начин
const beautifulArray = [];

//Функция, която добавя правило/условие към шаблона за port knocking
const addNewRuleToPattern = () => {
	let selectedPort = document.getElementById("portNumber").value;
	let transportProtocol = document.getElementById("transportProtocol").value;

	if (selectedPort === null || selectedPort === "") {
		return;
	}
	mainObj.patternRules.push({
		port: selectedPort,
		transport: transportProtocol,
	});

	let string = `${
		beautifulArray.length + 1
	}) ${transportProtocol} ---- ${selectedPort}\n`;
	beautifulArray.push(string);
	document.getElementById("pattern").append(string);
};

//Функция за управление за събитие
const handlePortsToSecureOnChange = () => {
	let portsToSecure = document.getElementById("portsToSecure").value.split(",");
	mainObj.portsToSecure = portsToSecure.map((el) => el.trim());
	console.log(mainObj.portsToSecure);
};

//Функция за управление за събитие
const handleTimeoutOnChange = () => {
	let timeout = document.getElementById("timeout").value;
	mainObj.timeoout = timeout;
};

//Функция за управление за събитие
const handleTimeoutBetweenPackets = () => {
	let timeoutBetweenPackets = document.getElementById(
		"timeoutBetweenPackets"
	).value;
	mainObj.timeoutBetweenPackets = timeoutBetweenPackets;
};

//Функция за управление за събитие
const handleOnCopy = () => {
	let textarea = document.getElementById("script");
	textarea.select();
	document.execCommand("copy");
};

//Функция за управление за събитие. Изчиства всичко
const handleClearAll = () => {
	location.reload();
};

//Основна функция, която генерира скрипта на базата на данните от mainObj
const generateScript = () => {
	document.getElementById("script").value = "";

	console.log(mainObj.portsToSecure);
	if (mainObj.portsToSecure.length === 0 || mainObj.patternRules === []) {
		alert("Некоректни входни данни!");
		return;
	}

	mainObj.script += "sudo iptables -F \n";
	mainObj.script += "sudo iptables -N KNOCKING \n";
	for (let index = 0; index < mainObj.patternRules.length; index++) {
		mainObj.script += `sudo iptables -N GATE${index + 1}\n`;
	}
	mainObj.script += "sudo iptables -N PASSED \n";
	mainObj.script +=
		"sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT \n";
	mainObj.script += "sudo iptables -A INPUT -i lo -j ACCEPT \n";
	mainObj.script += "sudo iptables -A INPUT -j KNOCKING \n";
	//First rule definition
	mainObj.script += `sudo iptables -A GATE1 -p ${mainObj.patternRules[0].transport} --dport ${mainObj.patternRules[0].port} -m recent --name AUTH1 --set -j DROP\n`;
	mainObj.script += "sudo iptables -A GATE1 -j DROP \n";
	//N-th rule definition
	for (let index = 1; index <= mainObj.patternRules.length; index++) {
		if (index === mainObj.patternRules.length) {
			mainObj.script += `sudo iptables -A PASSED -m recent --name AUTH${index} --remove\n`;
			mainObj.portsToSecure.forEach((port) => {
				mainObj.script += `sudo iptables -A PASSED -p tcp --dport ${port} -j ACCEPT \n`;
			});
			mainObj.script += "sudo iptables -A PASSED -j GATE1 \n";
			break;
		}
		mainObj.script += `sudo iptables -A GATE${
			index + 1
		} -m recent --name AUTH${index} --remove \n`;
		mainObj.script += `sudo iptables -A GATE${index + 1} -p ${
			mainObj.patternRules[index].transport
		} --dport ${mainObj.patternRules[index].port} -m recent --name AUTH${
			index + 1
		} --set -j DROP \n`;

		mainObj.script += `sudo iptables -A GATE${index + 1} -j GATE1\n`;
	}
	mainObj.script += `sudo iptables -A KNOCKING -m recent --rcheck --seconds ${mainObj.timeoout} --name AUTH${mainObj.patternRules.length} -j PASSED \n`;
	for (let index = mainObj.patternRules.length - 1; index > 0; index--) {
		mainObj.script += `sudo iptables -A KNOCKING -m recent --rcheck --seconds ${
			mainObj.timeoutBetweenPackets
		} --name AUTH${index} -j GATE${index + 1}\n`;
	}
	document.getElementById("script").value = mainObj.script;
	console.log(mainObj.script);
};
