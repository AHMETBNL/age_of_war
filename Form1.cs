using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace age_of_war
{
    public partial class Form1: Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void btn_skor_tablosu_Click(object sender, EventArgs e)
        {
            skor_tablosu skor_tablo = new skor_tablosu();
            skor_tablo.Show();
        }

        private void btn_oyna_Click(object sender, EventArgs e)
        {
            ana_oyun oyun = new ana_oyun();
            oyun.Show();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            panel1.BackgroundImage = Image.FromFile(@"C:\Users\90551\OneDrive\Masaüstü\age_of_war\age_of_war_backcolor.png");
            panel1.BackgroundImageLayout = ImageLayout.Stretch; // Görseli panele yay
        }
    }
}
