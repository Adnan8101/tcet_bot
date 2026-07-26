import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawData = `
Data 
Divison : A
year : TT

Class: ST A
R. No	Name of Student
1	Agarwal Keshav Vinit
2	Ambani Krish Deepak
3	Ambekar Sahil Chandrashekhar
4	Ansari Adnan Tofeeq
5	Ansari Mohammed Muzzammil Irfan
6	Bala Sudalaimuthu Sudalaimuthu Arumugam
7	Banerjee Dev Shivcharan
8	Batulwar Saisha Vijay
9	Bhaidkar Prathamesh Sudarshan
10	Bharati Ashutosh Abhimanyu
11	Bhat Arnav Arun
12	Choudhary Tanusri Bipin Kumar
13	Chaplot Jain Mahek Sandip
15	Chaudhary Rohit Virendra Singh
16	Chaudhari Vipul Sakharam
17	Chauhan Ranjeet Sukhvinder Singh
18	Chavan Shree Tushar
19	Chouhan Nimeet Amar
20	Dangwal Prerana Mahendra
21	Deb Anurag Diptesh
22	Desai Divy Ajay
23	Desai Tanisha Amit
24	Dholu Yugal Jayantilal
25	Dubey Nitin Chhabinath
26	Dubey Ritu Vinod
27	Dubey Sanjana Vinay Dubey
28	Dubey Utsaw Awadhesh
29	Gautam Aditya Rajesh
30	Giri Gaurav Rakesh Kumar
31	Gond Aditya Sunil
32	Gore Aayush Chetan
33	Gupta Aditya Lallan
34	Gupta Bhoomi Rajesh
35	Gupta Chandan Dinesh
36	Gupta Hemant Amit
37	Gupta Nilesh Harindra
38	Gupta Saumya Santosh
39	Gupta Sejal Mahesh
40	Gupta Shweta Sanjay
41	Gupta Siddharth Pawan
42	Gupta Sitanshu Sanjay
43	Gupta Swati Kumari Lakshman
44	Gupta Vaibhav Vinay
45	Haldar Ainesh Avinash
46	Howal Ritu Pradeep
47	Jain Hardik Kamlesh
48	Jaiswal Angilla Gajanan
49	Jaiswal Kartik Sunil
50	Jaiswal Nirek Nitin
51	Jaiswal Piyush Shivkumar
52	Jaiswar Sanket Horilal
53	Jani Ganesh Raju
54	Jha Alokkumar Parmanand
55	Jha Ankush Saroj
56	Jha Anurag Mithilesh
57	Jha Mantu Satish
58	Jha Shekhar Shivkumar
59	Jha Siddharth Pankaj
60	Kadam Neel Sambhaji
61	Kalambe Anand Maruti
62	Kalsaria Dhanvi Hitesh
63	Kamerkar Samiksha Milind
64	Vivek Chougale
65	Nirmohi Sankhe
66	Shaikh Mustafa
67	Shaik Tabish
68	Shruti Sonmale
69	Rutuja Yemle

divison : B
Year : TT
Class: ST B
R. No	Name of Student
1	Kanojiya Yuvraj Aatmaram
2	Karn Ridhi Kumar Rajnish
3	Kataria Krupa Rahul
4	Khan Arsalaan Mohammed M
5	Khan Mohd Asad
6	Kharde Sarvadnya Madhav
7	Kharwar Yashavi Jayprakash
8	Khot Parineeta Sainath
9	Kishnani Piyush Manish
10	Koiri Sayali Janardan
11	Koranne Riya Abhay
12	Kumawat Ayush Sanwarmal
13	Kunder Sarika Tulsidas
14	Mahadik Alok Sharad
15	Mahajan Karthik Santosh
16	Mandal Prakash Nageshwar
17	Maurya Anujkumar Arvind
18	Maurya Harsh Sushil
19	Maurya Nitin Dinesh
20	Maurya Varun Shivkumar
21	Mhapsekar Atharva Krishnakant
22	Mishra Ayush Gorakhnath
23	Mishra Harsh Rajesh
24	Mishra Nikita Subhash
25	Mishra Satyam Praneshwar
26	Mishra Shreya Prashant
27	Mishra Suryakant Pawan
28	Mittal Avani Sachin Kumar
29	Modi Manav Vivek
30	More Sania Sanjay
31	Mulani Arman Rahiman
32	Naik Swayam Pradeep
33	Nangare Prajwal Amar
34	Nigade Om Ramesh
35	Nipun Raj Rakesh Kumar
36	Nishad Aakash Chandradev
37	Pal Abhishek Rakesh
38	Pal Krish Omprakash
39	Pandey Aaditya Arjun
40	Pandey Aditya Vijayshankar
41	Pandey Amarnath Umesh
42	Pandey Aparna Jagdish
43	Pandey Shriyansh Dinesh
44	Panigrahi Sumit Sanatan
45	Parikh Henil Jignesh
46	Parshatwar Anuj Shailendra
47	Patankar Aryan Devendra
48	Pathak Harsh Mukesh
50	Patil Omkar Rajesh
51	Patil Soham Milind
52	Patil Tushar Gunwant
53	Pednekar Dikshant Arvind
54	Pisal Rohan Dattatraya
55	Prajapati Piyush Neeraj
56	Prajapati Raunak Jitendra
57	Prajapati Shubham Manoj
58	Prasad Ananya Surendra
59	Prasad Priyanshu Naresh
61	Puri Pooja Rakesh
62	Purohit Miteshkumar Deeparam
63	Purohit Ritikkumar Pratap
64	Rayyan Bhati
65	Aaryan Chavhan
66	Harshini R. Mishal
67	Hussain Dalkhaniya
68	Arya Pawar
69	Abhijith Mahesh Shetty

DIVISON : C
YEAR : TT
R. No	Name of Student
1	Puthan Rudransh Atul
2	Rai Shlok Dilipkumar
3	Rai Tiya Anupam
4	Sahu Amit Sunilkumar
5	Salvi Yash Rambhau
6	Sawant Pranjal Vinod
7	Sengupta Ronojoy Samrat
8	Shah Harsh Nilesh
9	Shah Meetmanish Manish
10	Shah Yash Jignesh
11	Shahi Shreya Pragati
12	Shaikh Aayan Altaf
13	Shaikh Mohammed Ayan M
14	Shaikh Mohd Saaem Zakir H
15	Sharma Amankumar Anil
16	Shetty Pawan Narayan
17	Shetty Rishith Umesh
19	Shinde Rohit Sudhir
20	Shukla Anmol Ramesh
21	Shukla Nidhi Dilipkumar
22	Shukla Omeshwar Sunil
23	Shukla Shreehari Sanjay
24	Siddiqui Mohd Aman Nafis
26	Singh Aditya Manoj
27	Singh Amar Ajay
28	Singh Ansh Ravi
29	Singh Bhavesh Sona
30	Singh Prakash Vinod
31	Singh Priya Prashant
32	Singh Pushkar Narender
33	Singh Rohit Suresh
34	Singh Shivam Swatantra
35	Singh Shruti Shailendra Kumar
36	Soni Yash Mrunal
37	Sutar Ashmit Deepak
39	Tailor Diya Jitendra
40	Tailor Om Ketan
41	Tandel Atharva Kiran
42	Thakur Pratham Rajendrababu
43	Thorat Vedika Dinesh
44	Tiwari Abhinav Rajeev
45	Upadhaya Shivam Pravesh
46	Valam Parag Prakash
47	Varma Saurabh Santosh
48	Varma Shalu Sunil
49	Varun Ashish Shekhar
50	Vedpathak Rudrapriya Sandeep
51	Vishe Tanuja Kashinath
52	Vishwakarma Abhishek S
53	Vishwakarma Pranav Rajkumar
54	Warkad Sanchita Sanjay
55	Yadav Ankesh Radheshyam
56	Yadav Ashu Subash
57	Yadav Hariom Kanshraj
58	Yadav Pulkit Ram
59	Yadav Riya Amar Bahadur
60	Yadav Ruchi Ramesh Kumar
61	Yadav Shamik Ravi
62	Yadav Vishal Arvind
63	Yadav Yash Manoj Kumar
64	Karanraj Chauhan
65	Janvi Chaurasiya
66	Bharti Gupta
67	Afzal Khan
68	Anas Malkani
69	Sanjay Singh
70	Shreya Thakur
`;

async function importStudents() {
  const lines = rawData.split('\n');
  let currentDivision = '';
  let currentClass = '';
  const studentsToInsert = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('...')) continue;

    const divMatch = line.match(/DIVISON\s*:\s*([A-C])/i);
    if (divMatch) {
      currentDivision = divMatch[1].toUpperCase();
      continue;
    }

    const classMatch = line.match(/Class\s*:\s*(.+)/i);
    if (classMatch) {
      currentClass = classMatch[1].trim();
      continue;
    }

    // Attempt to match Roll No and Name
    const studentMatch = line.match(/^(\d+)\s+(.+)$/);
    if (studentMatch && currentDivision) {
      const rollNo = parseInt(studentMatch[1], 10);
      const name = studentMatch[2].trim();
      
      // Assign all classes to TT (Third Year) based on division
      const assignedClass = `TT ${currentDivision}`;

      studentsToInsert.push({
        division: currentDivision,
        class: assignedClass,
        roll_no: rollNo,
        name: name
      });
    }
  }

  // Add Dummy Data
  studentsToInsert.push({
    division: 'A',
    class: 'TT A',
    roll_no: 100,
    name: 'ADNAN QURESHI'
  });

  console.log(`Parsed ${studentsToInsert.length} students. Truncating old data and inserting new...`);
  
  await prisma.student.deleteMany();
  const created = await prisma.student.createMany({
    data: studentsToInsert
  });

  console.log(`Successfully inserted ${created.count} students!`);
}

importStudents()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
