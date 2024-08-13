// app.js
import { initializeGoogleSignIn, handleSignOut, isSignedIn, checkAuth } from './auth.js';

const specialCharMap = {
    'Bucuresti': 'București',
    'Iasi': 'Iași',
    'Cluj': 'Cluj',
    'Timis': 'Timiș',
    'Constanta': 'Constanța',
    'Brasov': 'Brașov',
    'Prahova': 'Prahova',
    'Galati': 'Galați',
    'Suceava': 'Suceava',
    'Dambovita': 'Dâmbovița',
    'Mures': 'Mureș',
    'Dolj': 'Dolj',
    'Arges': 'Argeș',
    'Bacau': 'Bacău',
    'Bihor': 'Bihor',
    'Sibiu': 'Sibiu',
    'Teleorman': 'Teleorman',
    'Olt': 'Olt',
    'Valcea': 'Vâlcea',
    'Buzau': 'Buzău',
    'Caras-Severin': 'Caraș-Severin',
    'Hunedoara': 'Hunedoara',
    'Vaslui': 'Vaslui',
    'Botosani': 'Botoșani',
    'Alba': 'Alba',
    'Gorj': 'Gorj',
    'Satu Mare': 'Satu Mare',
    'Neamt': 'Neamț',
    'Harghita': 'Harghita',
    'Braila': 'Brăila',
    'Vrancea': 'Vrancea',
    'Ialomita': 'Ialomița',
    'Mehedinti': 'Mehedinți',
    'Covasna': 'Covasna',
    'Calarasi': 'Călărași',
    'Giurgiu': 'Giurgiu',
    'Maramures': 'Maramureș',
    'Bistrita-Nasaud': 'Bistrița-Năsăud',
    'Arad': 'Arad',
    'Salaj': 'Sălaj',
    'Tulcea': 'Tulcea'
};

document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('search-form');
    const resultsTable = document.getElementById('results-table');
    const loadingIndicator = document.getElementById('loading-indicator');
    let currentListings = [];
    let selectedListings = [];
    let sortDirections = {
        price: 'asc',
        surface: 'asc',
        pricePerSqm: 'asc'
    };

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        performSearch();
    });

    async function performSearch() {
        if (!isSignedIn()) {
            alert('Please sign in to perform a search.');
            return;
        }
        const formData = new FormData(searchForm);
        const searchParams = new URLSearchParams(formData);

        for (const [key, value] of searchParams.entries()) {
            if (key === 'county' || key === 'city') {
                searchParams.set(key, specialCharMap[value] || value);
            }
        }

        try {
            showLoading();
            const response = await fetch(`https://template.24-7.ro:3000/api/listings?${searchParams}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            currentListings = data.pages;
            displayResults(currentListings, data.totalCount);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while fetching the data. Please try again.');
        } finally {
            hideLoading();
        }
    }


    function displayResults(listings, totalCount) {
        const tbody = resultsTable.querySelector('tbody');
        tbody.innerHTML = '';

        if (listings && listings.length > 0) {
            listings.forEach(item => {
                const row = tbody.insertRow();
                const viewButtonClass = getListingSource(item) === 'OLX' ? 'button olx-button' : 'button';
                row.innerHTML = `
                    <td><input type="checkbox" class="compare-checkbox" data-id="${item._id}"> ${item.title || 'N/A'}</td>
                    <td>${item.price || 'N/A'} ${item.currency || 'EUR'}</td>
                    <td>${item.surfaceBuilt || 'N/A'}</td>
                    <td>${calculatePricePerSqm(item.price, item.surfaceBuilt)}</td>
                    <td>${item.address || 'N/A'}</td>
                    <td><button onclick="viewDetails('${item._id}', '${getListingSource(item)}')" class="${viewButtonClass}">View</button></td>
                `;
            });

            const totalCountRow = tbody.insertRow(0);
            totalCountRow.innerHTML = `<td colspan="6">Total listings: ${totalCount}</td>`;
        } else {
            const row = tbody.insertRow();
            row.innerHTML = '<td colspan="6">No results found</td>';
        }

        setupCompareButton();
        setupFilterInputs();
    }

    function calculatePricePerSqm(price, surface) {
        if (price && surface && surface !== 'N/A') {
            const pricePerSqm = parseFloat(price) / parseFloat(surface);
            return pricePerSqm.toFixed(2);
        }
        return 'N/A';
    }

    function showLoading() {
        loadingIndicator.style.display = 'block';
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
    }

    function getListingSource(listing) {
        return listing._id.startsWith('olx_') ? 'OLX' : 'Trimbitasu';
    }

    // window.viewDetails = function(id, source) {
    //     const listing = currentListings.find(item => item._id === id);
    //     if (!listing) return;

    //     const modal = document.createElement('div');
    //     modal.className = 'modal';
    //     modal.style.display = 'block';

    //     if (source === 'OLX') {
    //         modal.innerHTML = `
    //             <div class="modal-content">
    //                 <span class="close">&times;</span>
    //                 <h2>${listing.title}</h2>
    //                 <p>Price: ${listing.price} ${listing.currency}</p>
    //                 <p>Surface: ${listing.surfaceBuilt} m²</p>
    //                 <p>Address: ${listing.address}</p>
    //                 <p>Description: ${listing.description || 'No description available.'}</p>
    //                 <a href="${listing.url}" target="_blank">View on OLX.ro</a>
    //             </div>
    //         `;
    //     } else {
    //         modal.innerHTML = `
    //             <div class="modal-content">
    //                 <span class="close">&times;</span>
    //                 <h2>${listing.title}</h2>
    //                 <p>Price: ${listing.price} ${listing.currency}</p>
    //                 <p>Surface: ${listing.surfaceBuilt} m²</p>
    //                 <p>Address: ${listing.address}</p>
    //                 <p>Description: ${listing.description || 'No description available.'}</p>
    //                 <a href="https://www.trimbitasu.ro/visitor/listings/${listing._id}" target="_blank">View on Trimbitasu.ro</a>
    //             </div>
    //         `;
    //     }

    //     document.body.appendChild(modal);

    //     const closeBtn = modal.querySelector('.close');
    //     closeBtn.onclick = function() {
    //         document.body.removeChild(modal);
    //     };

    //     window.onclick = function(event) {
    //         if (event.target == modal) {
    //             document.body.removeChild(modal);
    //         }
    //     };
    // };

    window.viewDetails = function(id, source) {
        const listing = currentListings.find(item => item._id === id);
        if (!listing) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';

        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>${listing.title}</h2>
                <p>Price: ${listing.price} ${listing.currency}</p>
                <p>Surface: ${listing.surfaceBuilt} m²</p>
                <p>Address: ${listing.address}</p>
                <p>Description: ${listing.description || 'No description available.'}</p>
                <a href="${listing.url}" target="_blank">View on ${source}</a>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = function() {
            document.body.removeChild(modal);
        };

        window.onclick = function(event) {
            if (event.target == modal) {
                document.body.removeChild(modal);
            }
        };
    };



    function setupCompareButton() {
        let compareButton = document.getElementById('compare-button');
        if (!compareButton) {
            compareButton = document.createElement('button');
            compareButton.id = 'compare-button';
            compareButton.textContent = 'Compare Selected';
            compareButton.className = 'button';
            document.getElementById('results').appendChild(compareButton);
        }
        compareButton.onclick = compareListings;
        compareButton.style.display = 'block';

        document.querySelectorAll('.compare-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const listingId = this.dataset.id;
                if (this.checked) {
                    if (selectedListings.length < 3) {
                        selectedListings.push(listingId);
                    } else {
                        this.checked = false;
                        alert('You can compare up to 3 listings at a time.');
                    }
                } else {
                    selectedListings = selectedListings.filter(id => id !== listingId);
                }
            });
        });
    }

    function compareListings() {
        if (selectedListings.length < 2) {
            alert('Please select at least 2 listings to compare.');
            return;
        }

        const comparedListings = currentListings.filter(listing => selectedListings.includes(listing._id));
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Compare Listings</h2>
                <table>
                    <tr>
                        <th>Feature</th>
                        ${comparedListings.map(listing => `<th>${listing.title}</th>`).join('')}
                    </tr>
                    <tr>
                        <td>Price</td>
                        ${comparedListings.map(listing => `<td>${listing.price} ${listing.currency}</td>`).join('')}
                    </tr>
                    <tr>
                        <td>Surface</td>
                        ${comparedListings.map(listing => `<td>${listing.surfaceBuilt} m²</td>`).join('')}
                    </tr>
                    <tr>
                        <td>Price/m²</td>
                        ${comparedListings.map(listing => `<td>${calculatePricePerSqm(listing.price, listing.surfaceBuilt)}</td>`).join('')}
                    </tr>
                    <tr>
                        <td>Address</td>
                        ${comparedListings.map(listing => `<td>${listing.address}</td>`).join('')}
                    </tr>
                </table>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = function() {
            document.body.removeChild(modal);
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                document.body.removeChild(modal);
            }
        }
    }

    function setupFilterInputs() {
        const thead = resultsTable.querySelector('thead');
        thead.querySelectorAll('th').forEach(th => {
            const column = th.dataset.column;
            if (column && ['price', 'surface', 'pricePerSqm'].includes(column)) {
                let filterInput = th.querySelector('input');
                if (!filterInput) {
                    filterInput = document.createElement('input');
                    filterInput.type = 'text';
                    filterInput.placeholder = `Filter ${column}`;
                    filterInput.addEventListener('input', () => filterResults(column, filterInput.value));
                    th.appendChild(filterInput);
                }
            }
        });
    }

    function filterResults(column, value) {
        const filteredListings = currentListings.filter(listing => {
            if (column === 'price') {
                return parseFloat(listing.price) >= parseFloat(value);
            } else if (column === 'surface') {
                return listing.surfaceBuilt !== 'N/A' && parseFloat(listing.surfaceBuilt) >= parseFloat(value);
            } else if (column === 'pricePerSqm') {
                const pricePerSqm = calculatePricePerSqm(listing.price, listing.surfaceBuilt);
                return pricePerSqm !== 'N/A' && parseFloat(pricePerSqm) >= parseFloat(value);
            }
            return true;
        });
        displayResults(filteredListings, filteredListings.length);
    }
    // Sorting functionality
    document.querySelectorAll('th').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.column;
            if (column) {
                sortListings(column);
                updateSortArrows(header);
            }
        });
    });
    function sortListings(column) {
        const direction = sortDirections[column] === 'asc' ? 1 : -1;
        currentListings.sort((a, b) => {
            if (column === 'price') {
                return (parseFloat(a.price) - parseFloat(b.price)) * direction;
            } else if (column === 'surface') {
                if (a.surfaceBuilt === 'N/A') return 1;
                if (b.surfaceBuilt === 'N/A') return -1;
                return (parseFloat(a.surfaceBuilt) - parseFloat(b.surfaceBuilt)) * direction;
            } else if (column === 'pricePerSqm') {
                const aPricePerSqm = calculatePricePerSqm(a.price, a.surfaceBuilt);
                const bPricePerSqm = calculatePricePerSqm(b.price, b.surfaceBuilt);
                if (aPricePerSqm === 'N/A') return 1;
                if (bPricePerSqm === 'N/A') return -1;
                return (parseFloat(aPricePerSqm) - parseFloat(bPricePerSqm)) * direction;
            }
            return 0;
        });
        sortDirections[column] = sortDirections[column] === 'asc' ? 'desc' : 'asc';
        displayResults(currentListings, currentListings.length);
    }

    function updateSortArrows(clickedHeader) {
        document.querySelectorAll('th').forEach(header => {
            const arrow = header.querySelector('.sort-arrow');
            if (arrow) {
                if (header === clickedHeader) {
                    arrow.textContent = sortDirections[header.dataset.column] === 'asc' ? '▲' : '▼';
                } else {
                    arrow.textContent = '▲';
                }
            }
        });
    }

    // Initialize Google Sign-In
    // initializeGoogleSignIn(updateUIForSignIn);

    // Sign-out button event listener
    document.getElementById('signout-button').addEventListener('click', function() {
        handleSignOut(updateUIForSignIn);
    });

    function updateUIForSignIn(isSignedIn, userName = '') {
        const signInButton = document.getElementById('google-signin-button');
        const signOutButton = document.getElementById('signout-button');
        const searchSection = document.getElementById('search');

        if (isSignedIn) {
            signInButton.style.display = 'none';
            signOutButton.style.display = 'block';
            searchSection.style.display = 'block';
            alert(`Welcome, ${userName}!`);
        } else {
            signInButton.style.display = 'block';
            signOutButton.style.display = 'none';
            searchSection.style.display = 'none';
            resultsTable.innerHTML = '';
        }
    }
    if (isSignedIn()) {
        const userName = localStorage.getItem('user_name');
        updateUIForSignIn(true, userName);
    } else {
        updateUIForSignIn(false);
    }
    initializeGoogleSignIn(updateUIForSignIn);
    // Add event listener for window resize to handle responsive design
    window.addEventListener('resize', handleResponsiveDesign);

    function handleResponsiveDesign() {
        const windowWidth = window.innerWidth;
        if (windowWidth <= 768) {
            // Mobile view adjustments
            document.body.classList.add('mobile-view');
            // Adjust table display for mobile
            const tableHeaders = document.querySelectorAll('#results-table th');
            const tableRows = document.querySelectorAll('#results-table tbody tr');
            tableHeaders.forEach((header, index) => {
                tableRows.forEach(row => {
                    const cell = row.cells[index];
                    cell.setAttribute('data-label', header.textContent);
                });
            });
        } else {
            // Desktop view
            document.body.classList.remove('mobile-view');
        }
    }

    // Call handleResponsiveDesign initially to set up the correct view
    handleResponsiveDesign();

});