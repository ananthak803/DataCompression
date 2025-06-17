#include <iostream>
#include <fstream>
#include <queue>
#include <unordered_map>
#include <string>

using namespace std;

// Huffman Tree Node
struct Node {
    char ch;
    int freq;
    Node *left, *right;

    Node(char c, int f) : ch(c), freq(f), left(nullptr), right(nullptr) {}
};

// Compare nodes for priority queue
struct Compare {
    bool operator()(Node* a, Node* b) {
        return a->freq > b->freq;
    }
};

// Generate codes recursively
void generateCodes(Node* root, string code, unordered_map<char, string>& codes) {
    if (!root) return;

    if (!root->left && !root->right) {
        codes[root->ch] = code;
    }

    generateCodes(root->left, code + "0", codes);
    generateCodes(root->right, code + "1", codes);
}

int main() {
    ifstream input("original_data.txt");
    if (!input) {
        cerr << "Cannot open original_text.txt" << endl;
        return 1;
    }

    string data, line;
    while (getline(input, line)) {
        data += line + '\n';
    }
    input.close();

    // Frequency map
    unordered_map<char, int> freq;
    for (char c : data) {
        freq[c]++;
    }

    // Build min-heap priority queue
    priority_queue<Node*, vector<Node*>, Compare> pq;
    for (auto& pair : freq) {
        pq.push(new Node(pair.first, pair.second));
    }

    // Build Huffman Tree
    while (pq.size() > 1) {
        Node* left = pq.top(); pq.pop();
        Node* right = pq.top(); pq.pop();
        Node* merged = new Node('\0', left->freq + right->freq);
        merged->left = left;
        merged->right = right;
        pq.push(merged);
    }

    Node* root = pq.top();
    unordered_map<char, string> codes;
    generateCodes(root, "", codes);

    // Encode the data
    string encoded;
    for (char c : data) {
        encoded += codes[c];
    }

    // Write encoded data
    ofstream outEncoded("encoded.txt");
    if (!outEncoded) {
        cerr << "Cannot open encoded.txt" << endl;
        return 1;
    }
    outEncoded << encoded;
    outEncoded.close();

    // Write codes to codes.txt
    ofstream outCodes("codes.txt");
    if (!outCodes) {
        cerr << "Cannot open codes.txt" << endl;
        return 1;
    }
    for (auto& pair : codes) {
        string key;
        if (pair.first == '\n') key = "\\n";
        else if (pair.first == ' ') key = "\\s";
        else if (pair.first == '"') key = "\\\"";
        else key = string(1, pair.first);

        outCodes << key << " " << pair.second << "\n";
    }
    outCodes.close();

    cout << "Compression done. Encoded data and codes written successfully." << endl;
    return 0;
}
