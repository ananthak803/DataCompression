#include <iostream>
#include <fstream>
#include <string>
#include <unordered_map>

using namespace std;

// Huffman tree node
struct Node
{
    char ch;
    Node *left, *right;
    Node(char c = '\0') : ch(c), left(nullptr), right(nullptr) {}
};

// Build Huffman tree from code table
Node *buildTree(const unordered_map<string, char> &reverseCodes)
{
    Node *root = new Node();
    for (auto &pair : reverseCodes)
    {
        string code = pair.first;
        char ch = pair.second;
        Node *current = root;
        for (char bit : code)
        {
            if (bit == '0')
            {
                if (!current->left)
                    current->left = new Node();
                current = current->left;
            }
            else
            {
                if (!current->right)
                    current->right = new Node();
                current = current->right;
            }
        }
        current->ch = ch;
    }
    return root;
}

int main()
{
    ifstream codeFile("codes.txt");
    if (!codeFile)
    {
        cerr << "Cannot open codes.txt" << endl;
        return 1;
    }

    unordered_map<string, char> reverseCodes;
    string chStr, code;
    while (codeFile >> chStr >> code)
    {
        char actualChar;
        if (chStr == "\\n")
            actualChar = '\n';
        else if (chStr == "\\\"")
            actualChar = '\"'; // For \"
        else if (chStr == "\\{")
            actualChar = '{';
        else if (chStr == "\\}")
            actualChar = '}';
        else
            actualChar = chStr[0]; // For normal characters
        reverseCodes[code] = actualChar;
    }
    codeFile.close();

    Node *root = buildTree(reverseCodes);

    ifstream inFile("encoded.txt");
    if (!inFile)
    {
        cerr << "Cannot open encoded.txt" << endl;
        return 1;
    }

    string bitString, line;
    while (getline(inFile, line))
        bitString += line;
    inFile.close();

    string decoded;
    Node *current = root;
    for (char bit : bitString)
    {
        current = (bit == '0') ? current->left : current->right;
        if (!current->left && !current->right)
        {
            decoded += current->ch;
            current = root;
        }
    }

    ofstream out("decoded.txt");
    if (!out)
    {
        cerr << "Cannot open decoded.txt" << endl;
        return 1;
    }

    out << decoded;
    out.close();

    cout << "Decoding done. Output written to decoded.txt" << endl;
    return 0;
}
