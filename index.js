var fs = require('fs');

module.exports = function(bytes, size) {
    // Read the file with no encoding for raw buffer access.
    if (size === undefined) {
        var file = bytes;
        if (!fs.existsSync(file))
           return false;
        bytes = fs.readFileSync(file);
        size = fs.statSync(file).size;
    } 

    var suspicious_bytes = 0;
    var total_bytes = size > 1024 ? 1024 : size;
    
    if (size == 0)
        return false;

    if (size >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF) {
        /* UTF-8 BOM. This isn't binary. */
        return 0;
    }

    for (var i = 0; i < total_bytes; i++) {  
        // Read at least 32 bytes before making a decision
        if (i > 32 && (suspicious_bytes * 100) / total_bytes > 10) {
            return true;
        } 

        if (bytes[i] == '0') {
            // NULL char. It's binary
            return true;
        }
        else if ((bytes[i] < 7 || bytes[i] > 14) && (bytes[i] < 32 || bytes[i] > 127)) {
            // UTF-8 detection
            if (bytes[i] > 191 && bytes[i] < 224 && i + 1 < total_bytes) {
                i++;
                if (bytes[i] < 192) {
                    continue;
                }
            } 
            else if (bytes[i] > 223 && bytes[i] < 239 && i + 2 < total_bytes) {
                i++;
                if (bytes[i] < 192 && bytes[i + 1] < 192) {
                    i++;
                    continue;
                }
            }
            suspicious_bytes++;
        }
    }

    if ((suspicious_bytes * 100) / total_bytes > 10) {
        return true;
    }
    
    return false;
}
