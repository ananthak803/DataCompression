#include <iostream>
#include <fstream>
#include <string>
#include <unordered_map>
#include <queue>
#include <vector>

using namespace std;

// Huffman tree node
typedef struct Node {
    char ch;
    int freq;
    Node *left, *right;
    Node(char c, int f) : ch(c), freq(f), left(nullptr), right(nullptr) {}
    Node(Node* l, Node* r) : ch('\0'), freq(l->freq + r->freq), left(l), right(r) {}
} Node;

// Compare for priority queue
struct Compare {
    bool operator()(Node* a, Node* b) {
        return a->freq > b->freq;
    }
};

// Build Huffman codes
void buildCodes(Node* root, string prefix, unordered_map<char,string>& codes) {
    if (!root) return;
    if (!root->left && !root->right) {
        codes[root->ch] = prefix;
    }
    buildCodes(root->left, prefix + "0", codes);
    buildCodes(root->right, prefix + "1", codes);
}

int main() {
    // Read input
    ifstream input("input.txt");
    if (!input) {
        cerr << "Error: cannot open input.txt" << endl;
        return 1;
    }
    string data, line;
    while (getline(input, line)) {
        data += line;
        data += '\n';
    }
    input.close();

    // Count frequencies
    unordered_map<char,int> freq;
    for (char c : data) {
        freq[c]++;
    }

    // Build min-heap
    priority_queue<Node*, vector<Node*>, Compare> pq;
    for (auto& kv : freq) {
        pq.push(new Node(kv.first, kv.second));
    }
    // Edge case: single unique char
    if (pq.size() == 1) {
        pq.push(new Node('\0', 0));
    }

    // Build Huffman tree
    while (pq.size() > 1) {
        Node* left = pq.top(); pq.pop();
        Node* right = pq.top(); pq.pop();
        pq.push(new Node(left, right));
    }
    Node* root = pq.top();

    // Generate codes
    unordered_map<char,string> codes;
    buildCodes(root, "", codes);

    // Encode data
    string encoded;
    encoded.reserve(data.size());
    for (char c : data) {
        encoded += codes[c];
    }

    // Write output as 0/1 string
    ofstream output("output.txt");
    if (!output) {
        cerr << "Error: cannot open output.txt" << endl;
        return 1;
    }
    output << encoded;
    output.close();

    cout << "Encoding complete. Bits written to output.txt" << endl;
    return 0;
}
