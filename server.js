const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Create/connect to database
const db = new sqlite3.Database('my_table.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables
db.serialize(() => {
  // SKPD table
  db.run(`CREATE TABLE IF NOT EXISTS skpd (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    alamat TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Status Usulan table
  db.run(`CREATE TABLE IF NOT EXISTS status_usulan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Periode table
  db.run(`CREATE TABLE IF NOT EXISTS periode (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tahun INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Usulan table (main table)
  db.run(`CREATE TABLE IF NOT EXISTS usulan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    judul TEXT NOT NULL,
    deskripsi TEXT,
    pengusul TEXT,
    kode_wilayah TEXT,
    latitude REAL,
    longitude REAL,
    skpd_id INTEGER,
    periode_id INTEGER,
    status_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME, -- New column for soft delete
    FOREIGN KEY(skpd_id) REFERENCES skpd(id),
    FOREIGN KEY(periode_id) REFERENCES periode(id),
    FOREIGN KEY(status_id) REFERENCES status_usulan(id)
  )`);

  // Gambar Usulan table
  db.run(`CREATE TABLE IF NOT EXISTS gambar_usulan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usulan_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    keterangan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usulan_id) REFERENCES usulan(id) ON DELETE CASCADE
  )`);

  // Insert sample data
  console.log('Tables created successfully.');
  
  // Sample SKPD data
  db.run(`INSERT OR IGNORE INTO skpd (id, nama, alamat) VALUES 
    (1, 'Dinas Pekerjaan Umum', 'Jl. Merdeka No. 123'),
    (2, 'Dinas Kesehatan', 'Jl. Sudirman No. 456'),
    (3, 'Dinas Pendidikan', 'Jl. Gatot Subroto No. 789')`);

  // Sample Status Usulan data
  db.run(`INSERT OR IGNORE INTO status_usulan (id, nama) VALUES 
    (1, 'Pending'),
    (2, 'Disetujui'),
    (3, 'Ditolak'),
    (4, 'Dalam Proses')`);

  // Sample Periode data
  db.run(`INSERT OR IGNORE INTO periode (id, tahun) VALUES 
    (1, 2023),
    (2, 2024),
    (3, 2025)`);

  // Sample Usulan data
  db.run(`INSERT OR IGNORE INTO usulan (id, judul, deskripsi, pengusul, kode_wilayah, latitude, longitude, skpd_id, periode_id, status_id) VALUES 
    (1, 'Pembangunan Jalan Raya', 'Pembangunan jalan raya sepanjang 2 km', 'Ahmad Hidayat', '3201', -6.2088, 106.8456, 1, 2, 2),
    (2, 'Renovasi Puskesmas', 'Renovasi gedung puskesmas kecamatan', 'Siti Nurhaliza', '3202', -6.1944, 106.8229, 2, 2, 1)`);

  // Sample Gambar Usulan data
  db.run(`INSERT OR IGNORE INTO gambar_usulan (id, usulan_id, file_path, keterangan) VALUES 
    (1, 1, '/uploads/jalan_raya_1.jpg', 'Foto kondisi jalan saat ini'),
    (2, 1, '/uploads/jalan_raya_2.jpg', 'Desain jalan yang diusulkan'),
    (3, 2, '/uploads/puskesmas_1.jpg', 'Kondisi puskesmas yang perlu renovasi')`);
});

// =========================
// USULAN ENDPOINTS
// =========================

// GET all usulan with related data
app.get('/api/usulan', (req, res) => {
  const query = `
    SELECT u.*, 
           s.nama as skpd_nama,
           p.tahun as periode_tahun,
           st.nama as status_nama
    FROM usulan u
    LEFT JOIN skpd s ON u.skpd_id = s.id
    LEFT JOIN periode p ON u.periode_id = p.id
    LEFT JOIN status_usulan st ON u.status_id = st.id
    WHERE u.deleted_at IS NULL -- Exclude soft-deleted records
    ORDER BY u.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// NEW: GET filtered usulan data (Data Usulan Asmas)
app.get('/api/usulan-asmas', (req, res) => {
  const { tahun, status_id, skpd_id, search } = req.query;
  
  let query = `
    SELECT u.*, 
           s.nama as skpd_nama,
           s.alamat as skpd_alamat,
           p.tahun as periode_tahun,
           st.nama as status_nama
    FROM usulan u
    LEFT JOIN skpd s ON u.skpd_id = s.id
    LEFT JOIN periode p ON u.periode_id = p.id
    LEFT JOIN status_usulan st ON u.status_id = st.id
    WHERE u.deleted_at IS NULL -- Exclude soft-deleted records
  `;
  
  const params = [];
  
  // Filter by tahun (periode)
  if (tahun) {
    query += ` AND p.tahun = ?`;
    params.push(tahun);
  }
  
  // Filter by status usulan
  if (status_id) {
    query += ` AND u.status_id = ?`;
    params.push(status_id);
  }
  
  // Filter by SKPD
  if (skpd_id) {
    query += ` AND u.skpd_id = ?`;
    params.push(skpd_id);
  }
  
  // Search by name (judul, pengusul, or deskripsi)
  if (search) {
    query += ` AND (u.judul LIKE ? OR u.pengusul LIKE ? OR u.deskripsi LIKE ?)`;
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }
  
  query += ` ORDER BY u.created_at DESC`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Get total count for pagination info
    let countQuery = `
      SELECT COUNT(*) as total
      FROM usulan u
      LEFT JOIN skpd s ON u.skpd_id = s.id
      LEFT JOIN periode p ON u.periode_id = p.id
      LEFT JOIN status_usulan st ON u.status_id = st.id
      WHERE u.deleted_at IS NULL -- Exclude soft-deleted records
    `;
    
    let countParams = [];
    
    if (tahun) {
      countQuery += ` AND p.tahun = ?`;
      countParams.push(tahun);
    }
    
    if (status_id) {
      countQuery += ` AND u.status_id = ?`;
      countParams.push(status_id);
    }
    
    if (skpd_id) {
      countQuery += ` AND u.skpd_id = ?`;
      countParams.push(skpd_id);
    }
    
    if (search) {
      countQuery += ` AND (u.judul LIKE ? OR u.pengusul LIKE ? OR u.deskripsi LIKE ?)`;
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        data: rows,
        total: countResult.total,
        filters: {
          tahun: tahun || null,
          status_id: status_id || null,
          skpd_id: skpd_id || null,
          search: search || null
        }
      });
    });
  });
});

// GET usulan by ID with complete data
app.get('/api/usulan/:id', (req, res) => {
  const usulanQuery = `
    SELECT u.*, 
           s.nama as skpd_nama, s.alamat as skpd_alamat,
           p.tahun as periode_tahun,
           st.nama as status_nama
    FROM usulan u
    LEFT JOIN skpd s ON u.skpd_id = s.id
    LEFT JOIN periode p ON u.periode_id = p.id
    LEFT JOIN status_usulan st ON u.status_id = st.id
    WHERE u.id = ? AND u.deleted_at IS NULL -- Exclude soft-deleted records
  `;
  
  const gambarQuery = `SELECT * FROM gambar_usulan WHERE usulan_id = ? ORDER BY created_at`;
  
  db.get(usulanQuery, [req.params.id], (err, usulan) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!usulan) {
      return res.status(404).json({ error: 'Usulan not found' });
    }
    
    // Get related images
    db.all(gambarQuery, [req.params.id], (err, gambar) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      usulan.gambar = gambar;
      res.json(usulan);
    });
  });
});

// POST new usulan
app.post('/api/usulan', (req, res) => {
  const { judul, deskripsi, pengusul, kode_wilayah, latitude, longitude, skpd_id, periode_id, status_id } = req.body;
  
  const query = `
    INSERT INTO usulan (judul, deskripsi, pengusul, kode_wilayah, latitude, longitude, skpd_id, periode_id, status_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [judul, deskripsi, pengusul, kode_wilayah, latitude, longitude, skpd_id, periode_id, status_id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Get the created usulan with related data
    const getQuery = `
      SELECT u.*, 
             s.nama as skpd_nama,
             p.tahun as periode_tahun,
             st.nama as status_nama
      FROM usulan u
      LEFT JOIN skpd s ON u.skpd_id = s.id
      LEFT JOIN periode p ON u.periode_id = p.id
      LEFT JOIN status_usulan st ON u.status_id = st.id
      WHERE u.id = ?
    `;
    
    db.get(getQuery, [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(row);
    });
  });
});

// NEW: POST usulan asmas with complete data including multiple images
app.post('/api/usulan-asmas', (req, res) => {
  const { 
    judul, 
    deskripsi, 
    pengusul, 
    kode_wilayah, 
    latitude, 
    longitude, 
    skpd_id, 
    periode_id, 
    status_id,
    gambar // Array of image objects: [{ file_path, keterangan }, ...]
  } = req.body;
  
  // Validation
  if (!judul || !pengusul || !skpd_id || !periode_id || !status_id) {
    return res.status(400).json({ 
      error: 'Missing required fields: judul, pengusul, skpd_id, periode_id, status_id' 
    });
  }
  
  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Insert usulan
    const usulanQuery = `
      INSERT INTO usulan (judul, deskripsi, pengusul, kode_wilayah, latitude, longitude, skpd_id, periode_id, status_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(usulanQuery, [judul, deskripsi, pengusul, kode_wilayah, latitude, longitude, skpd_id, periode_id, status_id], function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to create usulan: ' + err.message });
      }
      
      const usulanId = this.lastID;
      
      // Insert multiple images if provided
      if (gambar && Array.isArray(gambar) && gambar.length > 0) {
        let completedInserts = 0;
        let hasError = false;
        
        gambar.forEach((img, index) => {
          if (hasError) return;
          
          if (!img.file_path) {
            db.run('ROLLBACK');
            hasError = true;
            return res.status(400).json({ 
              error: `Image at index ${index} missing file_path` 
            });
          }
          
          const gambarQuery = `
            INSERT INTO gambar_usulan (usulan_id, file_path, keterangan) 
            VALUES (?, ?, ?)
          `;
          
          db.run(gambarQuery, [usulanId, img.file_path, img.keterangan || ''], function(imgErr) {
            if (imgErr && !hasError) {
              db.run('ROLLBACK');
              hasError = true;
              return res.status(500).json({ 
                error: 'Failed to save image: ' + imgErr.message 
              });
            }
            
            completedInserts++;
            
            // All images inserted successfully
            if (completedInserts === gambar.length && !hasError) {
              finalizeSave(usulanId);
            }
          });
        });
      } else {
        // No images to insert, proceed to finalize
        finalizeSave(usulanId);
      }
      
      function finalizeSave(usulanId) {
        // Commit transaction
        db.run('COMMIT');
        
        // Get complete usulan data with all relations and images
        const completeQuery = `
          SELECT u.*, 
                 s.nama as skpd_nama,
                 s.alamat as skpd_alamat,
                 p.tahun as periode_tahun,
                 st.nama as status_nama
          FROM usulan u
          LEFT JOIN skpd s ON u.skpd_id = s.id
          LEFT JOIN periode p ON u.periode_id = p.id
          LEFT JOIN status_usulan st ON u.status_id = st.id
          WHERE u.id = ?
        `;
        
        db.get(completeQuery, [usulanId], (err, usulanData) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Get images
          const gambarQuery = `SELECT * FROM gambar_usulan WHERE usulan_id = ? ORDER BY created_at`;
          
          db.all(gambarQuery, [usulanId], (err, gambarData) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            usulanData.gambar = gambarData;
            res.status(201).json({
              message: 'Usulan Asmas created successfully',
              data: usulanData
            });
          });
        });
      }
    });
  });
});

// PUT update usulan
app.put('/api/usulan/:id', (req, res) => {
  const { judul, deskripsi, pengusul, kode_wilayah, latitude, longitude, skpd_id, periode_id, status_id } = req.body;
  
  const query = `
    UPDATE usulan 
    SET judul = ?, deskripsi = ?, pengusul = ?, kode_wilayah = ?, 
        latitude = ?, longitude = ?, skpd_id = ?, periode_id = ?, status_id = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [judul, deskripsi, pengusul, kode_wilayah, latitude, longitude, skpd_id, periode_id, status_id, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usulan not found' });
    }
    
    // Get updated usulan
    const getQuery = `
      SELECT u.*, 
             s.nama as skpd_nama,
             p.tahun as periode_tahun,
             st.nama as status_nama
      FROM usulan u
      LEFT JOIN skpd s ON u.skpd_id = s.id
      LEFT JOIN periode p ON u.periode_id = p.id
      LEFT JOIN status_usulan st ON u.status_id = st.id
      WHERE u.id = ?
    `;
    
    db.get(getQuery, [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row);
    });
  });
});

// NEW: PUT update usulan asmas with complete data including multiple images
app.put('/api/usulan-asmas/:id', (req, res) => {
  const { 
    judul, 
    deskripsi, 
    pengusul, 
    kode_wilayah, 
    latitude, 
    longitude, 
    skpd_id, 
    periode_id, 
    status_id,
    gambar, // Array of image objects: [{ file_path, keterangan }, ...]
    replace_images // Boolean: true to replace all images, false to add to existing
  } = req.body;
  
  const usulanId = req.params.id;
  
  // Validation
  if (!judul || !pengusul || !skpd_id || !periode_id || !status_id) {
    return res.status(400).json({ 
      error: 'Missing required fields: judul, pengusul, skpd_id, periode_id, status_id' 
    });
  }
  
  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Update usulan
    const usulanQuery = `
      UPDATE usulan 
      SET judul = ?, deskripsi = ?, pengusul = ?, kode_wilayah = ?, 
          latitude = ?, longitude = ?, skpd_id = ?, periode_id = ?, status_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    db.run(usulanQuery, [judul, deskripsi, pengusul, kode_wilayah, latitude, longitude, skpd_id, periode_id, status_id, usulanId], function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to update usulan: ' + err.message });
      }
      
      if (this.changes === 0) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Usulan not found' });
      }
      
      // Handle images if provided
      if (gambar && Array.isArray(gambar)) {
        // If replace_images is true, delete existing images first
        if (replace_images) {
          db.run('DELETE FROM gambar_usulan WHERE usulan_id = ?', [usulanId], (delErr) => {
            if (delErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to delete existing images: ' + delErr.message });
            }
            insertImages();
          });
        } else {
          insertImages();
        }
      } else {
        // No images to process, finalize
        finalizeSave();
      }
      
      function insertImages() {
        if (gambar.length === 0) {
          finalizeSave();
          return;
        }
        
        let completedInserts = 0;
        let hasError = false;
        
        gambar.forEach((img, index) => {
          if (hasError) return;
          
          if (!img.file_path) {
            db.run('ROLLBACK');
            hasError = true;
            return res.status(400).json({ 
              error: `Image at index ${index} missing file_path` 
            });
          }
          
          const gambarQuery = `
            INSERT INTO gambar_usulan (usulan_id, file_path, keterangan) 
            VALUES (?, ?, ?)
          `;
          
          db.run(gambarQuery, [usulanId, img.file_path, img.keterangan || ''], function(imgErr) {
            if (imgErr && !hasError) {
              db.run('ROLLBACK');
              hasError = true;
              return res.status(500).json({ 
                error: 'Failed to save image: ' + imgErr.message 
              });
            }
            
            completedInserts++;
            
            if (completedInserts === gambar.length && !hasError) {
              finalizeSave();
            }
          });
        });
      }
      
      function finalizeSave() {
        // Commit transaction
        db.run('COMMIT');
        
        // Get complete updated usulan data
        const completeQuery = `
          SELECT u.*, 
                 s.nama as skpd_nama,
                 s.alamat as skpd_alamat,
                 p.tahun as periode_tahun,
                 st.nama as status_nama
          FROM usulan u
          LEFT JOIN skpd s ON u.skpd_id = s.id
          LEFT JOIN periode p ON u.periode_id = p.id
          LEFT JOIN status_usulan st ON u.status_id = st.id
          WHERE u.id = ?
        `;
        
        db.get(completeQuery, [usulanId], (err, usulanData) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Get images
          const gambarQuery = `SELECT * FROM gambar_usulan WHERE usulan_id = ? ORDER BY created_at`;
          
          db.all(gambarQuery, [usulanId], (err, gambarData) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            usulanData.gambar = gambarData;
            res.json({
              message: 'Usulan Asmas updated successfully',
              data: usulanData
            });
          });
        });
      }
    });
  });
});

// DELETE usulan (soft delete)
app.delete('/api/usulan/:id', (req, res) => {
  const query = `UPDATE usulan SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`;
  
  db.run(query, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usulan not found' });
    }
    
    res.status(204).send();
  });
});

// =========================
// SKPD ENDPOINTS
// =========================

app.get('/api/skpd', (req, res) => {
  db.all('SELECT * FROM skpd ORDER BY nama', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/skpd', (req, res) => {
  const { nama, alamat } = req.body;
  db.run('INSERT INTO skpd (nama, alamat) VALUES (?, ?)', [nama, alamat], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.get('SELECT * FROM skpd WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(row);
    });
  });
});

// =========================
// STATUS USULAN ENDPOINTS
// =========================

app.get('/api/status-usulan', (req, res) => {
  db.all('SELECT * FROM status_usulan ORDER BY nama', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/status-usulan', (req, res) => {
  const { nama } = req.body;
  db.run('INSERT INTO status_usulan (nama) VALUES (?)', [nama], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.get('SELECT * FROM status_usulan WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(row);
    });
  });
});

// =========================
// PERIODE ENDPOINTS
// =========================

app.get('/api/periode', (req, res) => {
  db.all('SELECT * FROM periode ORDER BY tahun DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/periode', (req, res) => {
  const { tahun } = req.body;
  db.run('INSERT INTO periode (tahun) VALUES (?)', [tahun], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.get('SELECT * FROM periode WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(row);
    });
  });
});

// =========================
// GAMBAR USULAN ENDPOINTS
// =========================

app.get('/api/usulan/:id/gambar', (req, res) => {
  db.all('SELECT * FROM gambar_usulan WHERE usulan_id = ? ORDER BY created_at', [req.params.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/usulan/:id/gambar', (req, res) => {
  const { file_path, keterangan } = req.body;
  const usulan_id = req.params.id;
  
  db.run('INSERT INTO gambar_usulan (usulan_id, file_path, keterangan) VALUES (?, ?, ?)', 
    [usulan_id, file_path, keterangan], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.get('SELECT * FROM gambar_usulan WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(row);
    });
  });
});

app.delete('/api/gambar/:id', (req, res) => {
  db.run('DELETE FROM gambar_usulan WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Gambar not found' });
    }
    
    res.status(204).send();
  });
});

// =========================
// SERVER START
// =========================

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('=== USULAN ===');
  console.log('GET    /api/usulan                    - Get all usulan');
  console.log('GET    /api/usulan-asmas             - Get filtered usulan (Data Usulan Asmas)');
  console.log('POST   /api/usulan-asmas             - Create usulan asmas with complete data + multiple images');
  console.log('PUT    /api/usulan-asmas/:id         - Update usulan asmas with complete data + multiple images');
  console.log('GET    /api/usulan/:id               - Get usulan by ID with complete data');
  console.log('POST   /api/usulan                   - Create new usulan');
  console.log('PUT    /api/usulan/:id               - Update usulan');
  console.log('DELETE /api/usulan/:id               - Delete usulan (soft delete)');
  console.log('');
  console.log('=== FILTER PARAMETERS for /api/usulan-asmas ===');
  console.log('?tahun=2024                          - Filter by year');
  console.log('?status_id=1                         - Filter by status ID');
  console.log('?skpd_id=2                           - Filter by SKPD ID');
  console.log('?search=jalan                        - Search in title, pengusul, or description');
  console.log('Combined: ?tahun=2024&status_id=1&search=jalan');
  console.log('');
  console.log('=== USULAN ASMAS PAYLOAD EXAMPLE ===');
  console.log('POST/PUT Body:');
  console.log(JSON.stringify({
    judul: "Pembangunan Jalan Asmas",
    deskripsi: "Pembangunan infrastruktur jalan untuk akses yang lebih baik",
    pengusul: "Ahmad Asmas",
    kode_wilayah: "3201",
    latitude: -6.2088,
    longitude: 106.8456,
    skpd_id: 1,
    periode_id: 2,
    status_id: 1,
    gambar: [
      { file_path: "/uploads/gambar1.jpg", keterangan: "Kondisi awal" },
      { file_path: "/uploads/gambar2.jpg", keterangan: "Desain usulan" },
      { file_path: "/uploads/gambar3.jpg", keterangan: "Lokasi pembangunan" }
    ],
    replace_images: true
  }, null, 2));
  console.log('');
  console.log('=== SKPD ===');
  console.log('GET    /api/skpd                     - Get all SKPD');
  console.log('POST   /api/skpd                     - Create new SKPD');
  console.log('');
  console.log('=== STATUS USULAN ===');
  console.log('GET    /api/status-usulan            - Get all status usulan');
  console.log('POST   /api/status-usulan            - Create new status usulan');
  console.log('');
  console.log('=== PERIODE ===');
  console.log('GET    /api/periode                  - Get all periode');
  console.log('POST   /api/periode                  - Create new periode');
  console.log('');
  console.log('=== GAMBAR USULAN ===');
  console.log('GET    /api/usulan/:id/gambar        - Get gambar for usulan');
  console.log('POST   /api/usulan/:id/gambar        - Add gambar to usulan');
  console.log('DELETE /api/gambar/:id               - Delete gambar');
});

// Close database connection on exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});