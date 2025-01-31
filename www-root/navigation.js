function navigate(direction) {
    const nextPage = currentPage + direction;
    if (nextPage >= 0 && nextPage < totalPages) {
        window.location.href = `result${nextPage}.html`;
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        navigate(-1);
    } else if (e.key === 'ArrowRight') {
        navigate(1);
    }
});

// Update button states
document.querySelector('.prev-btn').disabled = currentPage === 0;
document.querySelector('.next-btn').disabled = currentPage === totalPages - 1;
