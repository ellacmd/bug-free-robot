const ROLES = ['admin', 'user', 'moderator', 'guest'];
const STATUSES = ['active', 'inactive', 'pending', 'suspended'];
const DEPARTMENTS = [
    'Engineering',
    'Marketing',
    'Sales',
    'HR',
    'Finance',
    'Operations',
    'Customer Support',
    'Product',
    'Design',
    'Legal',
];

const FIRST_NAMES = [
    'John',
    'Jane',
    'Michael',
    'Sarah',
    'David',
    'Emily',
    'Robert',
    'Jessica',
    'William',
    'Ashley',
    'James',
    'Amanda',
    'Christopher',
    'Jennifer',
    'Daniel',
    'Lisa',
    'Matthew',
    'Nancy',
    'Anthony',
    'Karen',
    'Mark',
    'Betty',
    'Donald',
    'Helen',
    'Carol',
    'Joshua',
    'Ruth',
    'Kenneth',
    'Sharon',
    'Kevin',
    'Michelle',
    'Laura',
    'George',
    'Timothy',
    'Kimberly',
    'Ronald',
    'Deborah',
    'Jason',
    'Dorothy',
    'Edward',
    'Jeffrey',
    'Ryan',
    'Jacob',
];

const LAST_NAMES = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
    'Lee',
    'Perez',
    'Thompson',
    'White',
    'Harris',
    'Sanchez',
    'Clark',
    'Ramirez',
    'Lewis',
    'Robinson',
    'Walker',
    'Young',
    'Allen',
    'King',
    'Wright',
    'Scott',
    'Torres',
    'Nguyen',
    'Hill',
    'Flores',
    'Green',
    'Adams',
    'Nelson',
    'Baker',
    'Hall',
    'Rivera',
    'Campbell',
    'Mitchell',
    'Carter',
    'Roberts',
    'Gomez',
    'Phillips',
    'Evans',
    'Turner',
    'Diaz',
];

const EMAIL_DOMAINS = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'company.com',
    'example.org',
    'test.net',
    'demo.io',
    'sample.co',
    'business.com',
];

const START_DATE = new Date('2020-01-01').getTime();
const END_DATE = new Date().getTime();
const DATE_RANGE = END_DATE - START_DATE;

let seed = 12345;
function fastRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
}

function getRandomElement(array) {
    return array[Math.floor(fastRandom() * array.length)];
}

function generateEmail(firstName, lastName, domain) {
    const first = firstName.toLowerCase();
    const last = lastName.toLowerCase();
    const random = Math.floor(fastRandom() * 100);
    return `${first}.${last}${random}@${domain}`;
}

function generateRandomDate() {
    const timestamp = START_DATE + Math.floor(fastRandom() * DATE_RANGE);
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
}

function generateScore() {
    const u1 = fastRandom();
    const u2 = fastRandom();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.min(100, Math.round(75 + z0 * 15)));
}

function generateRow(index) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const domain = getRandomElement(EMAIL_DOMAINS);

    const joinDate = generateRandomDate();
    const lastLoginDate = new Date(joinDate);
    lastLoginDate.setDate(
        lastLoginDate.getDate() + Math.floor(fastRandom() * 365)
    );

    return {
        id: `user-${index + 1}`,
        name: `${firstName} ${lastName}`,
        email: generateEmail(firstName, lastName, domain),
        role: getRandomElement(ROLES),
        status: getRandomElement(STATUSES),
        score: generateScore(),
        department: getRandomElement(DEPARTMENTS),
        joinDate,
        lastLogin: lastLoginDate.toISOString().split('T')[0],
    };
}

self.addEventListener('message', function (e) {
    const { type, requestId } = e.data;

    switch (type) {
        case 'GENERATE_DATA':
            {
                const { count, chunkSize } = e.data;
                const data = [];
                let processed = 0;

                async function sendToClients(message) {
                    const clients = await self.clients.matchAll();
                    clients.forEach((client) => {
                        client.postMessage(message);
                    });
                }

                function generateChunk() {
                    const endIndex = Math.min(processed + chunkSize, count);

                    for (let i = processed; i < endIndex; i++) {
                        data.push(generateRow(i));
                    }

                    processed = endIndex;
                    const progress = (processed / count) * 100;

                    sendToClients({
                        type: 'PROGRESS',
                        progress,
                        processed,
                        total: count,
                        requestId,
                    });

                    if (processed < count) {
                        setTimeout(generateChunk, 0);
                    } else {
                        sendToClients({
                            type: 'COMPLETE',
                            data,
                            requestId,
                        });
                    }
                }

                generateChunk();
            }
            break;

        case 'FETCH_API_DATA':
            {
                const {
                    endpoint,
                    method = 'GET',
                    headers = {},
                    body,
                    userCount = 10,
                    chunkSize = 1000,
                } = e.data;

                async function sendToClients(message) {
                    const clients = await self.clients.matchAll();
                    clients.forEach((client) => {
                        client.postMessage(message);
                    });
                }

                fetch(`https://randomuser.me/api/?results=${userCount}`, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers,
                    },
                    body: body ? JSON.stringify(body) : undefined,
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(
                                `HTTP error! status: ${response.status}`
                            );
                        }
                        return response.json();
                    })
                    .then((apiData) => {
                        const data = [];
                        let processed = 0;
                        const apiDataArray = apiData.results;
                        const apiDataLength = apiDataArray.length || 0;

                        const totalUsers = Math.max(userCount, apiDataLength);
                        const syntheticUsersNeeded = Math.max(
                            0,
                            userCount - apiDataLength
                        );

                        function processChunk() {
                            const endIndex = Math.min(
                                processed + chunkSize,
                                totalUsers
                            );

                            for (let i = processed; i < endIndex; i++) {
                                let transformedItem;

                                if (i < apiDataLength) {
                                    const item = apiDataArray[i];
                                    transformedItem = {
                                        id: item.login.uuid,
                                        name: `${item.name.first} ${item.name.last}`,
                                        email: item.email,
                                        role: getRandomElement(ROLES),
                                        status: getRandomElement(STATUSES),
                                        department:
                                            getRandomElement(DEPARTMENTS),
                                        score: item.score || generateScore(),
                                        joinDate:
                                            item.registered.date.split('T')[0],
                                        lastLogin: item.login.uuid,
                                    };
                                } else {
                                    transformedItem = generateRow(i);
                                }

                                data.push(transformedItem);
                            }

                            processed = endIndex;
                            const progress = (processed / totalUsers) * 100;

                            sendToClients({
                                type: 'API_PROGRESS',
                                progress,
                                processed,
                                total: totalUsers,
                                requestId,
                            });

                            if (processed < totalUsers) {
                                setTimeout(processChunk, 0);
                            } else {
                                sendToClients({
                                    type: 'API_COMPLETE',
                                    data,
                                    requestId,
                                });
                            }
                        }

                        processChunk();
                    })
                    .catch((error) => {
                        sendToClients({
                            type: 'API_ERROR',
                            error: error.message,
                            requestId,
                        });
                    });
            }
            break;

        case 'PARSE_CSV_DATA':
            {
                const {
                    file,
                    delimiter = ',',
                    hasHeader = true,
                    chunkSize = 1000,
                } = e.data;

                async function sendToClients(message) {
                    const clients = await self.clients.matchAll();
                    clients.forEach((client) => {
                        client.postMessage(message);
                    });
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        const csvText = e.target.result;
                        const lines = csvText.split('\n');
                        const data = [];
                        let processed = 0;
                        const total = lines.length;

                        const startIndex = hasHeader ? 1 : 0;
                        const actualTotal = total - startIndex;

                        function processChunk() {
                            const endIndex = Math.min(
                                processed + chunkSize,
                                actualTotal
                            );

                            for (let i = processed; i < endIndex; i++) {
                                const lineIndex = startIndex + i;
                                const line = lines[lineIndex];

                                if (line && line.trim()) {
                                    const columns = line
                                        .split(delimiter)
                                        .map((col) =>
                                            col.trim().replace(/"/g, '')
                                        );

                                    const transformedItem = {
                                        id: columns[0] || `csv_${i}`,
                                        name: columns[1] || `User ${i}`,
                                        email:
                                            columns[2] ||
                                            `user${i}@example.com`,
                                        role: columns[3] || 'user',
                                        status: columns[4] || 'active',
                                        department: columns[5] || 'General',
                                        score:
                                            parseInt(columns[6]) ||
                                            Math.floor(Math.random() * 100),
                                        joinDate:
                                            columns[7] ||
                                            new Date()
                                                .toISOString()
                                                .split('T')[0],
                                        lastLogin:
                                            columns[8] ||
                                            new Date()
                                                .toISOString()
                                                .split('T')[0],
                                    };
                                    data.push(transformedItem);
                                }
                            }

                            processed = endIndex;
                            const progress = (processed / actualTotal) * 100;

                            sendToClients({
                                type: 'CSV_PROGRESS',
                                progress,
                                processed,
                                total: actualTotal,
                                requestId,
                            });

                            if (processed < actualTotal) {
                                setTimeout(processChunk, 0);
                            } else {
                                sendToClients({
                                    type: 'CSV_COMPLETE',
                                    data,
                                    requestId,
                                });
                            }
                        }

                        processChunk();
                    } catch (error) {
                        sendToClients({
                            type: 'CSV_ERROR',
                            error: error.message,
                            requestId,
                        });
                    }
                };

                reader.onerror = function () {
                    sendToClients({
                        type: 'CSV_ERROR',
                        error: 'Failed to read CSV file',
                        requestId,
                    });
                };

                reader.readAsText(file);
            }
            break;
    }
});

self.addEventListener('install', function (e) {
    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    e.waitUntil(self.clients.claim());
});
