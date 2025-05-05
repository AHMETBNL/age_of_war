namespace age_of_war
{
    partial class Form1
    {
        /// <summary>
        ///Gerekli tasarımcı değişkeni.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///Kullanılan tüm kaynakları temizleyin.
        /// </summary>
        ///<param name="disposing">yönetilen kaynaklar dispose edilmeliyse doğru; aksi halde yanlış.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer üretilen kod

        /// <summary>
        /// Tasarımcı desteği için gerekli metot - bu metodun 
        ///içeriğini kod düzenleyici ile değiştirmeyin.
        /// </summary>
        private void InitializeComponent()
        {
            this.panel1 = new System.Windows.Forms.Panel();
            this.btn_oyna = new System.Windows.Forms.Button();
            this.btn_zorluk = new System.Windows.Forms.Button();
            this.btn_skor_tablosu = new System.Windows.Forms.Button();
            this.panel1.SuspendLayout();
            this.SuspendLayout();
            // 
            // panel1
            // 
            this.panel1.Controls.Add(this.btn_skor_tablosu);
            this.panel1.Controls.Add(this.btn_zorluk);
            this.panel1.Controls.Add(this.btn_oyna);
            this.panel1.Location = new System.Drawing.Point(1, 3);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(868, 582);
            this.panel1.TabIndex = 0;
            // 
            // btn_oyna
            // 
            this.btn_oyna.BackColor = System.Drawing.SystemColors.ButtonFace;
            this.btn_oyna.Location = new System.Drawing.Point(387, 159);
            this.btn_oyna.Name = "btn_oyna";
            this.btn_oyna.Size = new System.Drawing.Size(75, 23);
            this.btn_oyna.TabIndex = 1;
            this.btn_oyna.Text = "oyna";
            this.btn_oyna.UseVisualStyleBackColor = false;
            this.btn_oyna.Click += new System.EventHandler(this.btn_oyna_Click);
            // 
            // btn_zorluk
            // 
            this.btn_zorluk.BackColor = System.Drawing.SystemColors.ButtonFace;
            this.btn_zorluk.Location = new System.Drawing.Point(387, 197);
            this.btn_zorluk.Name = "btn_zorluk";
            this.btn_zorluk.Size = new System.Drawing.Size(75, 23);
            this.btn_zorluk.TabIndex = 2;
            this.btn_zorluk.Text = "zorluk";
            this.btn_zorluk.UseVisualStyleBackColor = false;
            // 
            // btn_skor_tablosu
            // 
            this.btn_skor_tablosu.BackColor = System.Drawing.SystemColors.ButtonFace;
            this.btn_skor_tablosu.Location = new System.Drawing.Point(387, 235);
            this.btn_skor_tablosu.Name = "btn_skor_tablosu";
            this.btn_skor_tablosu.Size = new System.Drawing.Size(75, 23);
            this.btn_skor_tablosu.TabIndex = 3;
            this.btn_skor_tablosu.Text = "skor tablosu";
            this.btn_skor_tablosu.UseVisualStyleBackColor = false;
            this.btn_skor_tablosu.Click += new System.EventHandler(this.btn_skor_tablosu_Click);
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(868, 584);
            this.Controls.Add(this.panel1);
            this.Name = "Form1";
            this.Text = "Form1";
            this.Load += new System.EventHandler(this.Form1_Load);
            this.panel1.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.Button btn_zorluk;
        private System.Windows.Forms.Button btn_oyna;
        private System.Windows.Forms.Button btn_skor_tablosu;
    }
}

