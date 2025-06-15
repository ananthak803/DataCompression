#include <iostream>
#include <fstream>
#include <string>
#include <unordered_map>

using namespace std;

// Read code mappings from codes.txt
unordered_map<char, string> readCodes(const string &filename) {
    unordered_map<char, string> codes;
    ifstream codeFile(filename);
    if (!codeFile) {
        cerr << "Cannot open " << filename << endl;
        return codes;
    }

    string chStr, code;
    while (codeFile >> chStr >> code) {
        char actualChar;
        if (chStr == "\\n")
            actualChar = '\n';
        else if (chStr == "\\s")
            actualChar = ' ';
        else if (chStr == "\\\"")
            actualChar = '"';
        else
            actualChar = chStr[0];

        codes[actualChar] = code;
    }

    codeFile.close();
    return codes;
}

int main() {
    // Load codes
    unordered_map<char, string> codes = readCodes("codes.txt");
    if (codes.empty()) {
        cerr << "No codes loaded. Exiting." << endl;
        return 1;
    }

    // Read original data
    ifstream input("original_data.txt");
    if (!input) {
        cerr << "Cannot open original_data.txt" << endl;
        return 1;
    }

    string data, line;
    while (getline(input, line)) {
        data += line + '\n';
    }
    input.close();

    // Encode data
    string encoded;
    for (char c : data) {
        if (codes.find(c) != codes.end()) {
            encoded += codes[c];
        } else {
            cerr << "Warning: No code found for character '" << c << "'" << endl;
        }
    }

    // Write encoded data
    ofstream out("encoded.txt");
    if (!out) {
        cerr << "Cannot open encoded.txt" << endl;
        return 1;
    }

    out << encoded;
    out.close();

    cout << "Encoding done. Output written to encoded.txt" << endl;
    return 0;
}
