const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/api/news', (req, res) => {
    res.json([
        { title: "Breaking News", body: "This is the latest update from the CYGNUS backend!" },
        { title: "Tech News", body: "Tech updates will appear here." },
    ]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
