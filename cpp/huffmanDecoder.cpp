#include <iostream>
#include <fstream>
#include <string>
#include <unordered_map>

using namespace std;

// Huffman tree node
struct Node {
    char ch;
    Node* left;
    Node* right;
    Node(char c = '\0') : ch(c), left(nullptr), right(nullptr) {}
};

// Build Huffman tree from code table
Node* buildTree(const unordered_map<string, char>& reverseCodes) {
    Node* root = new Node();
    for (auto& pair : reverseCodes) {
        string code = pair.first;
        char ch = pair.second;
        Node* current = root;

        for (char bit : code) {
            if (bit == '0') {
                if (!current->left) current->left = new Node();
                current = current->left;
            } else if (bit == '1') {
                if (!current->right) current->right = new Node();
                current = current->right;
            } else {
                // cerr << "Invalid bit in code: " << bit << endl;
                return nullptr;
            }
        }
        current->ch = ch;
    }
    return root;
}

int main() {
    // === Step 1: Read codes.txt ===
    ifstream codeFile("codes.txt");
    if (!codeFile) {
        cout << "Cannot open codes.txt" << endl;
        return 1;
    }

    unordered_map<string, char> reverseCodes;
    string chStr, code;

    while (codeFile >> chStr >> code) {
        char actualChar;
        if (chStr == "\\n")
            actualChar = '\n';
        else if (chStr == "\\\"")
            actualChar = '\"';
        else if (chStr == "\\{")
            actualChar = '{';
        else if (chStr == "\\}")
            actualChar = '}';
        else
            actualChar = chStr[0];

        reverseCodes[code] = actualChar;
    }

    codeFile.close();

    if (reverseCodes.empty()) {
        // cerr << "Code table is empty or malformed." << endl;
        return 1;
    }

    // cout << "Loaded " << reverseCodes.size() << " codes." << endl;

    // === Step 2: Build Huffman Tree ===
    Node* root = buildTree(reverseCodes);
    if (!root) {
        cout << "Failed to build Huffman tree." << endl;
        return 1;
    }

    // === Step 3: Read encoded.txt ===
    ifstream inFile("encoded.txt");
    if (!inFile) {
        cout << "Cannot open encoded.txt" << endl;
        return 1;
    }

    string bitString, line;
    while (getline(inFile, line)) {
        bitString += line;
    }
    inFile.close();

    if (bitString.empty()) {
        cout << "Encoded bitstring is empty." << endl;
        return 1;
    }

    // cout << "Loaded encoded bitstring of length " << bitString.length() << endl;

    // === Step 4: Decode the bitstring ===
    string decoded;
    Node* current = root;

    for (char bit : bitString) {
        if (!current) {
            cout << "Null traversal node. Bitstring or tree corrupted." << endl;
            return 1;
        }

        if (bit == '0')
            current = current->left;
        else if (bit == '1')
            current = current->right;
        else {
            cout << "Invalid bit: " << bit << endl;
            return 1;
        }

        if (!current) {
            cout<< "Invalid path in Huffman tree. Possibly corrupted bitstring." << endl;
            return 1;
        }

        if (!current->left && !current->right) {
            decoded += current->ch;
            current = root;
        }
    }

    // === Step 5: Write to decoded.txt ===
    ofstream out("decoded.txt");
    if (!out) {
        cout<< "Cannot open decoded.txt to write output." << endl;
        return 1;
    }

    out << decoded;
    out.close();

    cout << " Decoding complete. Output written to decoded.txt" << endl;
    return 0;
}
