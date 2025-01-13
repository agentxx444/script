<script>
        let allOrders = [];
        let currentPage = 1;
        const ordersPerPage = 10;
        let currentServiceId = '';

        async function fetchOrders(serviceId = '', page = 1) {
            const apiKey = 'uu3cpq260ogac4ll2r2x0303tc4cab3ioew3tj756gwh2mpa1siqudptsysrooe8'; 
            const url = `https://trendspherepro.com/adminapi/v2/orders?service_ids=${serviceId}&order_status=completed&sort=date-desc&limit=${ordersPerPage}&offset=${(page - 1) * ordersPerPage}`;

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'X-Api-Key': apiKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
                }

                const data = await response.json();
                

                if (!data.data || !Array.isArray(data.data.list)) {
                    throw new Error('Invalid data format: Missing or invalid "data.list" array');
                }

                allOrders = data.data.list;
                updateTable(allOrders);
                updatePagination(page);

            } catch (error) {
                console.error('Error fetching orders:', error);
                document.querySelector('#ordersTable tbody').innerHTML = `<tr><td colspan="6">Error fetching orders: ${error.message}</td></tr>`;
            }
        }


// Modify the updateTable function
async function updateTable(orders) {
    const tableBody = document.querySelector('#ordersTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No completed orders found.</td></tr>';
        return;
    }

    // Loop through each order to fetch its last_update data
    for (const order of orders) {
        const orderId = `<span class="highlight-pill">${order.id}</span>`;
        const serviceName = `<span class="highlight-pill">${order.service_id}</span> - ${order.service_name}`;
        const orderCreated = new Date(order.created);
        const lastUpdate = await fetchLastUpdate(order.id); // Fetch the last update using order ID
        const totalCharge = order.charge ? order.charge.formatted : 'N/A';
        const statusClass = getStatusClass(order.status);

        // Calculate the time difference in hours, minutes, seconds
        const avgTime = calculateTimeDifference(orderCreated, new Date(lastUpdate));

        const row = document.createElement('tr');
        row.className = 'completed';
        row.innerHTML = `
            <td>${orderId}</td>
            <td>${formatDate(orderCreated)}</td>
            <td><a href="#" onclick="handleServiceIdClick(${order.service_id})">${serviceName}</a></td>
            <td>${lastUpdate}</td> <!-- Display the last update -->
            <td>${order.quantity}</td>
            <td class="total-charge">${totalCharge}</td>
            <td>${avgTime}</td> <!-- Display Average Time -->
            <td class="status ${statusClass}">${order.status}</td>
        `;
        tableBody.appendChild(row);
    }
}

// Function to calculate the difference between two dates and return it as a formatted string
function calculateTimeDifference(startDate, endDate) {
    const diffMs = endDate - startDate; // Difference in milliseconds
    const diffSec = Math.floor(diffMs / 1000); // Convert to seconds
    const diffMin = Math.floor(diffSec / 60); // Convert to minutes
    const diffHr = Math.floor(diffMin / 60); // Convert to hours
    const diffDay = Math.floor(diffHr / 24); // Convert to days

    const hours = diffHr % 24;
    const minutes = diffMin % 60;

    // If the difference is less than a minute, return "INSTANT"
    if (diffSec < 60) {
        return 'INSTANT';
    }

    // Format the output based on the time difference
    let result = '';
    if (diffDay > 0) {
        result += `${diffDay} days, `;
    }
    if (diffHr > 0 || diffDay > 0) {
        result += `${hours} hours, `;
    }
    if (diffMin > 0 || diffHr > 0 || diffDay > 0) {
        result += `${minutes} minutes`;
    }

    return result;
}


// Function to fetch the last_update of an order using its ID
async function fetchLastUpdate(orderId) {
    const apiKey = 'uu3cpq260ogac4ll2r2x0303tc4cab3ioew3tj756gwh2mpa1siqudptsysrooe8';
    const url = `https://trendspherepro.com/adminapi/v2/orders/${orderId}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
        }

        const data = await response.json();
        if (data.data && data.data.last_update) {
            return formatDate(new Date(data.data.last_update));
        } else {
            throw new Error('Last update not available');
        }
    } catch (error) {
        console.error('Error fetching last update:', error);
        return 'Error fetching last update';
    }
}



        function formatDate(date) {
            return date.toLocaleString();
        }

        function getStatusClass(status) {
            switch (status.toLowerCase()) {
                case 'completed':
                    return 'completed';
                case 'pending':
                    return 'pending';
                case 'cancelled':
                    return 'cancelled';
                default:
                    return '';
            }
        }

        function handleSearch() {
            const searchTerm = document.getElementById('searchBox').value.trim();
            if (searchTerm === '') {
                currentPage = 1;
                updateTable([]);
                return;
            }

            currentServiceId = searchTerm;
            fetchOrders(searchTerm, currentPage);
        }

        function handleServiceIdClick(serviceId) {
            currentServiceId = serviceId;
            fetchOrders(serviceId, 1);
        }

        function updatePagination(page) {
            const prevButton = document.getElementById('prevPage');
            const nextButton = document.getElementById('nextPage');

            prevButton.disabled = page <= 1;
            nextButton.disabled = allOrders.length < ordersPerPage;

            currentPage = page;
        }

        function changePage(direction) {
            const newPage = currentPage + direction;
            fetchOrders(currentServiceId, newPage);
        }

        fetchOrders('', currentPage);
    </script>
